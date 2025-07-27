// watcher.js
const path = require("path");
const chokidar = require("chokidar");
const config = require("./config");
const { uploadFolder } = require("./drive");
const logError = require("./logger");

const pendingUploads = new Map();

function start() {
  console.log(`Watching for new folders in: ${config.WATCH_FOLDER}`);

  const watcher = chokidar.watch(config.WATCH_FOLDER, {
    depth: 0,
    ignoreInitial: true,
    awaitWriteFinish: true,
  });

  watcher.on("addDir", async (folderPath) => {
    const folderName = path.basename(folderPath);

    // Skip if already queued
    if (pendingUploads.has(folderPath)) return;

    console.log(
      `New folder detected: ${folderName}. Scheduling upload in ${config.SYNC_DELAY_MINUTES} minutes...`
    );

    const timeout = setTimeout(async () => {
      try {
        await uploadFolder(folderPath);
      } catch (err) {
        await logError(`SYNC FAIL | ${folderName} | ${err.message}`);
      } finally {
        pendingUploads.delete(folderPath);
      }
      // }, config.SYNC_DELAY_MINUTES * 60 * 1000);
    }, 1000);

    pendingUploads.set(folderPath, timeout);
  });

  watcher.on("error", async (error) => {
    await logError(`WATCHER ERROR | ${error.message}`);
  });
}

module.exports = { start };
