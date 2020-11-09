const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const cmtRef = db.ref("Comments");

const fs = require("fs"); // require thêm module filesystem

var result = "";
var characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var charactersLength = characters.length;
for (var i = 0; i < 10; i++) {
  result += characters.charAt(Math.floor(Math.random() * charactersLength));
}

// "https://mangatoon.mobi/vi/genre/comic?type=1&page=1"
const URL = null;
const dataType = typeof URL;

if (!URL) {
  console.log("LỖI: Vui lòng nhập URL(dòng 15) website cần get");
} else if (dataType !== "string") {
  console.log("LỖI: Kiểu dữ liệu của URL(dòng 15) là số chuỗi (string)");
} else {
  request(URL, (error, response, html) => {
    // START - Get home
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html); // load HTML
      const Mangas = [];
      // START - Get thông tin truyện 1
      $("#page-content .genre-content .items a").each((index, el) => {
        const href = $(el).attr("href"); //href để vào detail của 1 truyện
        const poster = $(el).find(".content-image img").attr("src");
        const name = $(el).find(".content-image img").attr("alt");
        const id = href.slice(11); //cắt chuỗi của href để làm id
        console.log();
        Mangas.push(id);

        // START - Get thông tin truyện 2
        request(`https://mangatoon.mobi${href}`, (error, response, html) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html); // load HTML

            const elBottom = $("#page-content .selected-detail ");

            $(elBottom)
              .find(".description-comment-wrap .comment-item")
              .each((index, el) => {
                const userAva = $(el).find(".head-image img").attr("src");
                const userName = $(el)
                  .find(".comment-right .user-name")
                  .text()
                  .trim();
                const userCmt = $(el)
                  .find(".comment-right .comment-detail")
                  .text()
                  .trim();

                //START - Upload cmt to firebase
                const cmtID = cmtRef.child(id).push().key;
                cmtRef
                  .child(id)
                  .child(cmtID)
                  .set({
                    info: {
                      avatar: userAva,
                      userName: userName,
                    },
                  });
                cmtRef.child(id).child(cmtID).child("cmts").push({
                  timeCreated: "2020/11/06 23:13",
                  userCmt,
                });
                //END - Upload cmt to firebase
              });

            //START - Get current time
            var today = new Date();

            var date =
              today.getFullYear() +
              "/" +
              (today.getMonth() + 1) +
              "/" +
              today.getDate();
            var time = today.getHours() + ":" + today.getMinutes();
            var dateTime = date + " " + time;
            //END - Get current time
          } else {
            console.log(error);
          }
        });

        // END - Get thông tin truyện 2
      });

      // END - Get thông tin truyện 1
    } else {
      console.log("Get home - " + error);
    }
    // END - Get home
    console.log("Đã xử lý xong!");
  });
}
