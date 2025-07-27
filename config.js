const path = require("path");

module.exports = {
  WATCH_FOLDER: path.join(__dirname, "../watched"),
  DRIVE_FOLDER_NAME: "Uploaded output",
  SYNC_DELAY_MINUTES: 15,
  CLEANUP_INTERVAL_MINUTES: 15,
  CLEANUP_AGE_HOURS: 24,
};
