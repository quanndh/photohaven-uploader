// drive.js
const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");
const mime = require("mime-types");
const readline = require("readline");
const config = require("./config");
const logError = require("./logger");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

async function authorize() {
  const credentialsRaw = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(credentialsRaw);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const tokenRaw = await fs.readFile(TOKEN_PATH, "utf-8");
    oAuth2Client.setCredentials(JSON.parse(tokenRaw));
    return oAuth2Client;
  } catch (err) {
    return getAccessToken(oAuth2Client);
  }
}

async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  console.log("Authorize this app by visiting this URL:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      resolve(code);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), "utf-8");
  console.log("Token stored to", TOKEN_PATH);
  return oAuth2Client;
}

async function getDriveClient() {
  const authClient = await authorize();
  return google.drive({ version: "v3", auth: authClient });
}

async function findOrCreateFolder(drive, folderName, parentId = null) {
  const queryParts = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `name = '${folderName}'`,
    "trashed = false",
  ];
  if (parentId) queryParts.push(`'${parentId}' in parents`);
  const q = queryParts.join(" and ");

  const res = await drive.files.list({
    q,
    fields: "files(id, name)",
  });

  if (res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : [],
    },
    fields: "id",
  });
  return folder.data.id;
}

async function uploadFolder(folderPath) {
  const drive = await getDriveClient();
  const outputParentId = await findOrCreateFolder(
    drive,
    config.DRIVE_FOLDER_NAME
  );

  const folderName = path.basename(folderPath);
  const folderId = await findOrCreateFolder(drive, folderName, outputParentId);

  let files;
  try {
    files = await fs.readdir(folderPath);
  } catch (err) {
    await logError(`READ FAIL | ${folderPath} | ${err.message}`);
    return;
  }

  const uploadPromises = files
    .filter((f) => f.match(/\.(png)$/i))
    .map(async (file) => {
      const filePath = path.join(folderPath, file);
      const mimeType = mime.lookup(filePath) || "application/octet-stream";

      try {
        await drive.files.create({
          resource: {
            name: file,
            parents: [folderId],
          },
          media: {
            mimeType,
            body: (await fs.open(filePath)).createReadStream(),
          },
          fields: "id",
        });
        console.log(`Uploaded ${file} to ${folderName}`);
      } catch (err) {
        await logError(
          `UPLOAD FAIL | ${file} in ${folderPath} | ${err.message}`
        );
      }
    });

  await Promise.all(uploadPromises);
  console.log(`Upload done ${folderName}`);
}

async function deleteOldDriveFolders() {
  const drive = await getDriveClient();
  const now = new Date();
  const outputParentId = await findOrCreateFolder(
    drive,
    config.DRIVE_FOLDER_NAME
  );

  const res = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and '${outputParentId}' in parents and trashed = false`,
    fields: "files(id, name, createdTime)",
  });

  const threshold = new Date(
    now.getTime() - config.CLEANUP_AGE_HOURS * 60 * 60 * 1000
  );

  for (const folder of res.data.files) {
    const created = new Date(folder.createdTime);
    if (created < threshold) {
      try {
        await drive.files.delete({ fileId: folder.id });
        console.log(`Deleted Drive folder: ${folder.name}`);
      } catch (err) {
        await logError(`DELETE FAIL | ${folder.name} | ${err.message}`);
      }
    }
  }
}

module.exports = {
  uploadFolder,
  deleteOldDriveFolders,
  authorize,
};
