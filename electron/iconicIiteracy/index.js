const { clipboard } = require("electron");
const path = require("path");
// const clipboardy = require("clipboardy");
const singleThreadOCR = require("../singleThread_js/singleThread"); //识图

async function identifyImage(imgUrl) {
  console.log(imgUrl, "yyds--kkk");
  const text = await singleThreadOCR({
    targetPhotoDir: imgUrl,
    languages: "chi_sim+eng",
    targetPath: path.join(__dirname, "./upload/"),
  });
  clipboard.writeText(text);
}

module.exports = { identifyImage };
