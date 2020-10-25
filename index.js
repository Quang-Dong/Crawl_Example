const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const mangaRef = db.ref("Mangas");

const fs = require("fs"); // require thêm module filesystem
let data = [];
let Mangas = [];
let Chapters = [];

var today = new Date();

request(
  "https://mangatoon.mobi/vi/genre/comic?type=1&page=0",
  (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html); // load HTML

      $("#page-content .genre-content .items a").each((index, el) => {
        // Get thông tin truyện
        const href = $(el).attr("href");
        const poster = $(el).find(".content-image img").attr("src");
        const name = $(el).find(".content-image img").attr("alt");
        const id = href.slice(11); //cắt chuỗi của href để làm id

        // START - Get thông tin truyện
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

            var date =
              today.getFullYear() +
              "/" +
              (today.getMonth() + 1) +
              "/" +
              today.getDate();
            var time = today.getHours() + ":" + today.getMinutes();
            var dateTime = date + " - " + time;

            // Mangas.push({ name, reads, likes, state });

            mangaRef.child(id).set(
              {
                id: id,
                name: name,
                author: author,
                poster: poster,
                totalReads: reads,
                totalLikes: likes,
                dateCreated: dateTime,
                state,
              },
              function (err) {
                if (err) {
                  console.log("Firebase thất bại");
                  return;
                } else {
                  console.log("Firebase thành công");
                  return;
                }
              }
            );

            //fs.writeFileSync("data.json", JSON.stringify(data));
            // fs.writeFileSync("mangas.json", JSON.stringify(Mangas));
            //fs.writeFileSync("chapters.json", JSON.stringify(Chapters));
          } else {
            console.log(error);
          }
        });

        // END - Get thông tin truyện

        // START - Get thông tin chapters
        // request(
        //   `https://mangatoon.mobi${href}/episodes`,
        //   (error, response, html) => {
        //     if (!error && response.statusCode == 200) {
        //       const $ = cheerio.load(html); // load HTML

        //       $(
        //         "#page-content .selected-episodes .episodes-wrap .episode-item"
        //       ).each((index, el) => {
        //         const chapterHref = $(el).attr("href");
        //         const chapterTitle = $(el).find(".episode-title").text().trim();
        //         const chapterDate = $(el)
        //           .find(".episode-date > span")
        //           .text()
        //           .trim();

        //         const date = chapterDate.slice(0, 10);

        //         // Chapters.push({ chapterTitle, chapterHref, date });
        //       });
        //     } else {
        //       console.log(error);
        //     }
        //   }
        // );
        // END - Get thông tin chapters
      });
    } else {
      console.log(error);
    }
  }
);
