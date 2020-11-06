const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const mangaRef = db.ref("Mangas");
const genreRef = db.ref("GenreOfManga");

const fs = require("fs"); // require thêm module filesystem

// "https://mangatoon.mobi/vi/genre/comic?type=1&page=1"
const URL = "https://mangatoon.mobi/vi/genre/comic?type=1&page=0";
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

        Mangas.push(id);

        // START - Get thông tin truyện 2
        request(`https://mangatoon.mobi${href}`, (error, response, html) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html); // load HTML

            const elTop = $("#page-content .detail-top-wrap .detail-top-left");
            const author = $(elTop).find(".created-by").text().trim();

            const elBottom = $("#page-content .selected-detail ");
            //tìm phần chứa 'lượt đọc' và 'lượt like', nó trả về 1 chuỗi chứa 'reads' và 'likes'
            //nên phải cắt 2 cái riêng biệt ra
            const totalReads = $(elBottom).find(".icon-wrap").text().trim();
            //cắt ra phần reads
            const reads = totalReads.slice(7, 15).trim();
            //loại bỏ dấu '.' của viết tắt số lượng (vd: 1.0M => 10M)
            const reads2 = reads.replace(".", "");
            //loại bỏ cứ tự cuối (vd: 10M => 10), vì phải đưa lên csdl kiểu số thì
            //mới xếp hạng được
            const quantityReads = reads2.slice(0, -1);

            const totalLikes = $(elBottom).find(".icon-wrap").text().trim();
            const likes = totalLikes.slice(40, 47).trim();
            const likes2 = likes.replace(".", "");
            const quantityLikes = likes2.slice(0, -1);

            const state = $(elBottom)
              .find(".icon-wrap .update-date")
              .text()
              .trim();

            const des = $(elBottom).find(".description").text().trim();
            //lấy vị trí của chuỗi 'truyện này do' sau đó cắt từ vị trí 0 đến nó
            const description = des.slice(0, des.indexOf("Truyện này do"));
            const genreList = [];
            $(elBottom)
              .find(".description-tag .tag")
              .each((index, el) => {
                const genre = $(el).text().trim();
                genreList.push(genre);
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
            var dateTime = date + " - " + time;
            //END - Get current time

            //START - Upload genre to firebase
            genreRef.child(id).set(
              {
                genre: genreList,
              },
              function (err) {
                if (err) {
                  console.log("THẤT BẠI - Save Genre Info: " + id);
                } else {
                  console.log(
                    "THÀNH CÔNG - Save Genre Info: " +
                      id +
                      " / " +
                      Mangas.length
                  );
                }
              }
            );
            //END - Upload genre to firebase

            //START - Upload mangas to firebase
            mangaRef.child(id).set(
              {
                id,
                author,
                poster,
                dateCreated: dateTime,
                name,
                totalReads: quantityReads,
                totalLikes: quantityLikes,
                state,
                description,
              },
              function (err) {
                if (err) {
                  console.log("THẤT BẠI - Save Manga Info: " + id);
                } else {
                  console.log(
                    "THÀNH CÔNG - Save Manga Info: " +
                      id +
                      " / " +
                      Mangas.length
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

        // //START - Get thông tin chapters
        // request(
        //   `https://mangatoon.mobi${href}/episodes`,
        //   (error, response, html) => {
        //     if (!error && response.statusCode == 200) {
        //       const $ = cheerio.load(html); // load HTML
        //       const Chapters = [];
        //       let countChap = [];
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

        //         const lastChap = chapterTitle.slice(8).trim();
        //         countChap.push(lastChap);

        //         //START - Upload chapter info to firebase
        //         chapterRef
        //           .child(id)
        //           .child(chapterTitle)
        //           .set(
        //             {
        //               imgs: "",
        //               dateCreadted: date,
        //               dateUpdated: date,
        //             },
        //             function (err) {
        //               if (err) {
        //                 console.log("THẤT BẠI - Save Chapter Info: " + id);
        //               } else {
        //                 console.log(
        //                   "THÀNH CÔNG - Save Chapter Info: " +
        //                     "id = " +
        //                     id +
        //                     " / " +
        //                     countChap.length
        //                 );
        //               }
        //             }
        //           );
        //         //END - Upload chapter info to firebase

        //         // Chapters.push({ chapterTitle, chapterHref, date });
        //       });
        //     } else {
        //       console.log("Get Chapters Info - " + error);
        //     }
        //   }
        // );
        // // END - Get thông tin chapters
      });

      // END - Get thông tin truyện 1
    } else {
      console.log("Get home - " + error);
    }
    // END - Get home
  });
}
