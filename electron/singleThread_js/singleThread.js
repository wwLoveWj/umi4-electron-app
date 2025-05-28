/**
 * 单线程执行ocr文字识别
 */
const { createWorker } = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");

// const worker = createWorker({
//   langPath: path.join(__dirname, "./lang-data"),
//   cachePath: path.join(__dirname),
//   logger: (m) =>
//     console.log(
//       `${dayjs().format("YYYY-MM-DD HH:mm:ss")}-${JSON.stringify(m)}`
//     ),
// });

/**
 * 1、生成要保存文字识别的文件
 * @param {*} targetPath
 */
const mkdirSync = async (targetPath) => {
  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath);
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * 2、单线程将图片文字识别到本地图片txt文件下
 * @param {*} param 参数
 * @param {*} param.targetPhotoDir 目标图片路径
 */
const singleThreadOCR = async ({ targetPhotoDir, languages, targetPath }) => {
  let worker = await createWorker(languages, 1, {
    langPath: path.join(__dirname, "./lang-data"),
    logger: (m) =>
      console.log(
        `${dayjs().format("YYYY-MM-DD HH:mm:ss")}-${JSON.stringify(m)}`
      ),
  });

  // await worker.load();
  // // 加载语言
  // await worker.loadLanguage(languages);
  // // 初始化
  // await worker.initialize(languages);
  // 识别
  const {
    data: { text },
  } = await worker.recognize(targetPhotoDir);
  console.log("结果", text);
  // 生成指定路径
  await mkdirSync(targetPath);

  // 写入文件
  const outputfileDir = `${targetPath}\img.txt`;
  fs.writeFileSync(outputfileDir, text);
  // detect():输出ocr的基本结果
  //  结果：data2 = { data: {orientation_confidence //方向_置信度;  orientation_degrees //方位_度;  script_confidence //脚本可信度} jobId //工作id }
  // const data2 = await worker.detect(path.join(__dirname, './images/b.png'))
  // console.log(`detect执行后的${data2}`)
  // 终止
  await worker.terminate();
  return text;
  // return `${targetPath}\img.txt`;
};
// singleThreadOCR({
//   targetPhotoDir: path.join(__dirname, "./images/taobaoShop6.png"),
//   languages: "chi_sim+eng",
//   targetPath: path.join(__dirname, "./output/"),
// });

module.exports = singleThreadOCR;
