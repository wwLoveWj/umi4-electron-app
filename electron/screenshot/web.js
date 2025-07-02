// var webpage = require("webpage");
// var page = webpage.create();
// page.open("http://www.example.com", function (status) {
//   console.log("Status: " + status);
//   debugger;
//   if (status === "success") {
//     page.render("example.png");
//   }
//   phantom.exit();
// });
const puppeteer = require("puppeteer");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const dayjs = require("dayjs");

// 读取配置
const configPath = path.join(__dirname, "./config.yaml");
let screenshotUrl = "http://localhost:8001/#/person";
let screenshotSavePath = "./public/screenshot.png";

/**
 * 使用 Puppeteer 进行网页截图
 */
(async () => {
  // 启动无头浏览器
  const browser = await puppeteer.launch({ headless: true });

  // 创建一个新页面
  const page = await browser.newPage();
  if (fs.existsSync(configPath)) {
    const config = yaml.load(fs.readFileSync(configPath, "utf8")) || {};
    if (config.screenshot) {
      if (config.screenshot.screenshotUrl) {
        screenshotUrl = config.screenshot.screenshotUrl;
      }
      if (config.screenshot.screenshotSavePath) {
        screenshotSavePath =
          config.screenshot.screenshotSavePath +
          `/${dayjs().format("YYYY-MM-DD HH_mm_ss")}.png`;
      }
    }
  }
  // 使用无头浏览器加载网页
  await page.goto(screenshotUrl, { waitUntil: "networkidle0" });

  // 等待页面主要内容加载完成
  await page.waitForSelector("body"); //确保页面主要内容已经加载

  // 进行网页截图
  await page.screenshot({ path: screenshotSavePath });

  // 关闭浏览器
  await browser.close();
})();
