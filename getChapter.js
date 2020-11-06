const cheerio = require("cheerio");

const request = require("request-promise");

const admin = require("./firebase"); // firebase path (./firebase/firebase.js)

var db = admin.database();

const chapterRef = db.ref("Chapters");

const id = 10; //int, not string

const dataType = typeof id;

if (!id) {
  console.log("LỖI: Vui lòng nhập ID(dòng 11) truyện cần get");
} else if (dataType !== "number") {
  console.log("Kiểu dữ liệu bạn nhập là: " + dataType);
  console.log("LỖI: Kiểu dữ liệu của ID(dòng 11) là số nguyên (int)");
} else {
  // START - Get thông tin chapters
  request(
    `https://mangatoon.mobi/vi/detail/${id}/episodes`,
    (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html); // load HTML

        let countChap = [];
        $("#page-content .selected-episodes .episodes-wrap .episode-item").each(
          (index, el) => {
            const chapterHref = $(el).attr("href").trim();
            const chapterTitle = $(el).find(".episode-title").text().trim();
            const chapterDate = $(el)
              .find(".episode-date > span")
              .text()
              .trim();

            const date = chapterDate.slice(0, 10).trim();
            const titleChap = chapterTitle.slice(8).trim();
            countChap.push(titleChap);

            //START - Upload thông tin chapter to firebase
            // chapterRef
            //   .child(id)
            //   .child(chapterTitle)
            //   .set(
            //     {
            //       imgs: "",
            //       dateCreadted: date,
            //       dateUpdated: date,
            //     },
            //     function (err) {
            //       if (err) {
            //         console.log("Firebase thất bại");
            //         return;
            //       } else {
            //         console.log("Firebase thành công");
            //         return;
            //       }
            //     }
            //   );
            //END - Upload thông tin chapter to firebase

            //START - Get imgs của chapters
            request(
              `https://mangatoon.mobi${chapterHref}`,
              (error, response, html) => {
                if (!error && response.statusCode == 200) {
                  const $ = cheerio.load(html); // load HTML

                  const el = $("#page-content .watch-page .pictures img");

                  const ChapterImgs = [];

                  for (let i = 0; i < el.length; i++) {
                    const Imgs = $(el[i]).attr("src").trim();

                    ChapterImgs.push(Imgs);
                  }

                  // START - Upload imgs của chapters to firebase
                  chapterRef
                    .child(id)
                    .child(titleChap)
                    .set(
                      {
                        info: {
                          id: titleChap,
                          dateCreadted: date,
                          dateUpdated: date,
                        },

                        images: ChapterImgs,
                      },
                      function (err) {
                        if (err) {
                          console.log("Save images thất bại: " + chapterTitle);
                          return;
                        } else {
                          console.log(
                            "Save images: " +
                              titleChap +
                              " / " +
                              countChap.length
                          );
                          return;
                        }
                      }
                    );
                  // END - Upload imgs của chapters to firebase

                  // fs.writeFileSync("imgs.json", JSON.stringify(ChapterImgs));
                } else {
                  console.log("Get imgs của chapters - " + error);
                }
              }
            );
            //END - Get imgs của chapters
          }
        );

        //   fs.writeFileSync("chapters.json", JSON.stringify(Chapters));
      } else {
        console.log("Get thông tin chapters - " + error);
      }
    }
  );
  // END - Get thông tin chapters
}
