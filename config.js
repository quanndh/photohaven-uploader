const path = require("path");

module.exports = {
  WATCH_FOLDER: path.join(__dirname, "../Upload_Sucess"),
  DRIVE_FOLDER_NAME: "Uploaded output",
  SYNC_DELAY_MINUTES: 5,
  CLEANUP_INTERVAL_MINUTES: 15,
  CLEANUP_AGE_HOURS: 24,
};
