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

/**
 * 使用 Puppeteer 进行网页截图
 */
(async () => {
  // 启动无头浏览器
  const browser = await puppeteer.launch({ headless: true });

  // 创建一个新页面
  const page = await browser.newPage();

  // 使用无头浏览器加载网页
  await page.goto(
    "https://www.baidu.com",
    { waitUntil: "networkidle0" } //这确保页面完全加载完成
  );

  // 等待页面主要内容加载完成
  await page.waitForSelector("body"); //确保页面主要内容已经加载

  // 进行网页截图
  await page.screenshot({ path: "./public/screenshot.png" });

  // 关闭浏览器
  await browser.close();
})();
