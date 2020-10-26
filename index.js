const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const mangaRef = db.ref("Mangas");
const chapterRef = db.ref("Chapters");

const fs = require("fs"); // require thêm module filesystem
const URL = "";
const dataType = typeof URL;

if (!URL) {
  console.log("LỖI: Vui lòng nhập URL(dòng 13) website cần get");
} else if (dataType !== "string") {
  console.log("LỖI: Kiểu dữ liệu của URL(dòng 13) là số chuỗi (string)");
} else {
  request(URL, (error, response, html) => {
    // START - Get home
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html); // load HTML
      const Mangas = [];
      // START - Get thông tin truyện 1
      $("#page-content .genre-content .items a").each((index, el) => {
        const href = $(el).attr("href");
        const poster = $(el).find(".content-image img").attr("src");
        const name = $(el).find(".content-image img").attr("alt");
        const id = href.slice(11); //cắt chuỗi của href để làm id

        // START - Get thông tin truyện 2
        request(`https://mangatoon.mobi${href}`, (error, response, html) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html); // load HTML

            const elTop = $("#page-content .detail-top-wrap .detail-top-left");
            const author = $(elTop).find(".created-by").text().trim();
            const genre = $(elTop).find(".top-comics-type").text().trim();

            const elBottom = $("#page-content .selected-detail ");
            const totalReads = $(elBottom).find(".icon-wrap").text().trim();

            const reads = totalReads.slice(7, 15).trim();

            const totalLikes = $(elBottom).find(".icon-wrap").text().trim();

            const likes = totalLikes.slice(40, 47).trim();

            const state = $(elBottom)
              .find(".icon-wrap .update-date")
              .text()
              .trim();

            //START - Get current time
            var today = new Date();

            var date =
              today.getFullYear() +
              "/" +
              (today.getMonth() + 1) +
              "/" +
              today.getDate();
            var time = today.getHours() + ":" + today.getMinutes();
            var dateTime = date + " - " + time;
            //END - Get current time

            //START - Upload mangas to firebase
            mangaRef.child(id).set(
              {
                id,
                author,
                poster,
                dateCreated: dateTime,
                name,
                totalReads: reads,
                totalLikes: likes,
                state,
              },
              function (err) {
                if (err) {
                  console.log("THẤT BẠI - Save Manga Info: " + id);
                } else {
                  console.log(
                    "THÀNH CÔNG - Save Manga Info: " + id + " / " + id.length
                  );
                }
              }
            );
            //END - Upload mangas to firebase

            // START - Save data to disk
            //     //fs.writeFileSync("data.json", JSON.stringify(data));
            //     // fs.writeFileSync("mangas.json", JSON.stringify(Mangas));
            //     //fs.writeFileSync("chapters.json", JSON.stringify(Chapters));
            // END - Save data to disk
          } else {
            console.log(error);
          }
        });

        // END - Get thông tin truyện 2

        // START - Get thông tin chapters
        request(
          `https://mangatoon.mobi${href}/episodes`,
          (error, response, html) => {
            if (!error && response.statusCode == 200) {
              const $ = cheerio.load(html); // load HTML
              const Chapters = [];
              $(
                "#page-content .selected-episodes .episodes-wrap .episode-item"
              ).each((index, el) => {
                const chapterHref = $(el).attr("href");
                const chapterTitle = $(el).find(".episode-title").text().trim();
                const chapterDate = $(el)
                  .find(".episode-date > span")
                  .text()
                  .trim();

                const date = chapterDate.slice(0, 10);

                //START - Upload chapter info to firebase
                chapterRef
                  .child(id)
                  .child(chapterTitle)
                  .set(
                    {
                      imgs: "",
                      dateCreadted: date,
                      dateUpdated: date,
                    },
                    function (err) {
                      if (err) {
                        console.log("THẤT BẠI - Save Chapter Info: " + id);
                      } else {
                        console.log("THÀNH CÔNG - Save Chapter Info: " + id);
                      }
                    }
                  );
                //END - Upload chapter info to firebase

                // Chapters.push({ chapterTitle, chapterHref, date });
              });
            } else {
              console.log("Get Chapters Info - " + error);
            }
          }
        );
        // END - Get thông tin chapters
      });

      // END - Get thông tin truyện 1
    } else {
      console.log("Get home - " + error);
    }
    // END - Get home
  });
}
