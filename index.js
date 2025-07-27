const watcher = require("./watcher");
const deleter = require("./deleter");
const { authorize } = require("./drive");

(async () => {
  await authorize();
  console.log("\nPhotoHaven uploader ready 🚀\n");
  watcher.start();
  deleter.scheduleCleanup();
})();
