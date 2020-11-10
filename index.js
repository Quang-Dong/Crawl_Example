const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const mangaRef = db.ref("Mangas");
const genreRef = db.ref("GenreOfManga");

const fs = require("fs"); // require thêm module filesystem
const { constants } = require("buffer");

// "https://mangatoon.mobi/vi/genre/comic?type=1&page=1"
const URL = "https://mangatoon.mobi/vi/genre/tags/29?type=1";
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
                //get genre from html
                const genre = $(el).text().toLowerCase().trim();
                genreList.push(genre);

                //START - Upload genre to firebase
                // genreRef
                //   .child(id)
                //   .child(genre)
                //   .set(genre)
                //   .catch((err) => {
                //     if (err) {
                //       console.log("THẤT BẠI - Save Genre Info: " + id);
                //     } else {
                //       console.log(
                //         "THÀNH CÔNG - Save Genre Info: " +
                //           id +
                //           " / " +
                //           Mangas.length
                //       );
                //     }
                //   });
                //END - Upload genre to firebase
                //START - Upload genre to firebase
                mangaRef
                  .child(id)
                  .child(genre)
                  .set(genre)
                  .catch((err) => {
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
                  });
                //END - Upload genre to firebase
              });
            // console.log(genreList.join(" "));

            //START - Upload mangas to firebase
            mangaRef.child(id).update(
              {
                id,
                author,
                poster,
                created: Date.now(),
                updated: Date.now(),
                name,
                totalReads: Number(quantityReads),
                totalLikes: Number(quantityLikes),
                state,
                description,
                genres: genreList.join(", "),
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
      });

      // END - Get thông tin truyện 1
    } else {
      console.log("Get home - " + error);
    }
    // END - Get home
  });
}
