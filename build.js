var electronInstaller = require("electron-winstaller");
var path = require("path");

resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: path.join(
    "../electron-quick-start/electron-quick-start-win32-x64"
  ), //刚才生成打包文件的路径
  outputDirectory: path.join("./tmp/build/installer64"), //输出路径
  authors: "ww", // 作者名称
  exe: "electron-quick-start.exe", //在appDirectory寻找exe的名字
  description: "yyds",
  noMsi: true, //不需要mis!
});

resultPromise.then(
  () => console.log("It worked!"),
  (e) => console.log(`No dice: ${e.message}`)
);
