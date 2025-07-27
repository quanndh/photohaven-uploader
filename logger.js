// logger.js
const fs = require("fs/promises");
const path = require("path");

const logPath = path.join(__dirname, "upload_errors.log");

function formatDate(date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

async function logError(message) {
  const timestamp = formatDate(new Date());
  const line = `[${timestamp}] ${message}\n`;
  try {
    await fs.appendFile(logPath, line, "utf8");
  } catch (err) {
    console.error(`Failed to write log: ${err.message}`);
  }
}

module.exports = logError;
