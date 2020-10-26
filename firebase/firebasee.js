var admin = require("firebase-admin");
var serviceAccount = require("./servicee-account-file.json");

module.exports = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://XXXfirebaseio.com",
});
