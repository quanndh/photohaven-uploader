// deleter.js
const config = require("./config");
const { deleteOldDriveFolders } = require("./drive");
const logError = require("./logger");

function scheduleCleanup() {
  const intervalMs = config.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  // const intervalMs = 1000;

  console.log(
    `Scheduled Drive folder cleanup every ${config.CLEANUP_INTERVAL_MINUTES} minutes.`
  );

  setInterval(async () => {
    try {
      await deleteOldDriveFolders();
    } catch (err) {
      await logError(`CLEANUP FAIL | ${err.message}`);
    }
  }, intervalMs);
}

module.exports = { scheduleCleanup };
