const {
  closeShotScreenWin,
  openShotScreenWin,
  webScreenshot,
} = require("./index");
const {
  app,
  Tray,
  Menu,
  MenuItem,
  clipboard,
  BrowserWindow,
} = require("electron");
const path = require("path");
const { identifyImage } = require("../iconicIiteracy/index");
const ttsHandler = require("../Text-To-Speech/components/tts-node");

function createTray(
  win,
  tray,
  icon = "/coding/20240320ww/my-umi-app/umi-template-wj/src/assets/imgs/flower.png"
) {
  // 创建任务栏图标
  tray = new Tray(path.resolve(__dirname, icon));
  // 菜单定义内容
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "朗读",
      submenu: [
        {
          label: "朗读设置",
          click: () => {
            ttsHandler.openSettingsWindow();
          },
        },
        {
          label: "开始朗读",
          click: () => {
            ttsHandler.startReading();
          },
        },
        {
          label: "朗读文章",
          click: () => {
            if (typeof ttsHandler.readArticle === "function") {
              ttsHandler.readArticle();
            } else {
              ttsHandler.startReading();
            }
          },
        },
        {
          label: "TTS测试页面",
          click: () => {
            const testWindow = new BrowserWindow({
              width: 900,
              height: 700,
              title: "TTS朗读测试",
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
              },
            });
            testWindow.loadFile(path.join(__dirname, "../tts-test.html"));
            // 关键：弹窗关闭时自动停止朗读
            testWindow.on("closed", () => {
              ttsHandler.stopReading && ttsHandler.stopReading();
            });
          },
        },
      ],
    },
    {
      label: "截图",
      click: () => {
        if (win) {
          closeShotScreenWin();
          win.hide();
          openShotScreenWin();
        }
      },
    },
    {
      label: "重启",
      click: () => {
        app.relaunch();
        app.quit();
      },
    },
    {
      label: "识图",
      click: async () => {
        // base64图片编码
        const imageSrc = clipboard.readImage().toDataURL();
        await identifyImage(imageSrc);
      },
    },
    {
      label: "退出",
      click: async function () {
        win.destroy();
        app.quit();
        win = null;
      },
    },
    {
      label: "网页截图",
      click: () => {
        webScreenshot("node ./electron/screenshot/web.js");
      },
    },
  ]);
  // 右下角托盘内容
  tray.setContextMenu(contextMenu);
  tray.setToolTip("欢迎访问创世纪系统~");
  tray.setTitle("创世纪系统");
  // 点击托盘图标，显示主窗口
  tray.on("click", () => {
    win.show();
  });
}

function createShortcutKeys(mainWindow) {
  // 全局快捷键
  const menu = new Menu();
  menu.append(
    new MenuItem({
      // label: "Electron",
      submenu: [
        {
          role: "截屏",
          accelerator:
            process.platform === "darwin" ? "Alt+Cmd+I" : "Alt+Shift+I",
          click: () => {
            if (mainWindow) {
              closeShotScreenWin();
              mainWindow.hide();
              openShotScreenWin();
            }
          },
        },
      ],
    })
  );
  Menu.setApplicationMenu(menu);
}

module.exports = {
  createTray,
  createShortcutKeys,
};
