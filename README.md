### Installation

1. Nodejs 20
2. Git
3. PM2 (npm i -g pm2)
4. Create Google Cloud Console project (https://console.cloud.google.com/)
5. Create 0Auth Client (https://console.cloud.google.com/apis/credentials)
6. Download config find save as `credentials.json`
7. Enable `Production(Publish App)` or add emails to `Test users` (https://console.cloud.google.com/auth/audience)
8. Update folder name to watch in config.js
9. Run with nodemon

```
pm2 start index.js --name photohaven-uploader

```
