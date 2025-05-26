// electron/main.js
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  nativeImage,
} = require("electron");
const { closeShotScreenWin, openShotScreenWin } = require("./utils");
const { ipcMainFn } = require("./ipcMain");
const { createTray, createShortcutKeys } = require("./utils/tray");
const path = require("path");
const process = require("process");
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;

if (require("electron-squirrel-startup")) return;
let tray = null; // 在外面创建tray变量，防止被自动删除，导致图标自动消失
// 创建主窗口
function createWindow() {
  // 避免可以重复打开多个程序
  if (gotTheLock) {
    app.on("second-instance", () => {
      if (mainWindow.isMinimized()) mainWindow.restore();

      mainWindow.focus();
    });
  } else {
    app.quit();
  }
  // 原文链接：https://blog.csdn.net/F520Hz/article/details/136544798
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
    // 更换任务栏图标
    icon: nativeImage.createFromPath(
      path.resolve(
        __dirname,
        "/coding/20240320ww/my-umi-app/umi-template-wj/src/assets/imgs/flower.png"
      )
    ),
  });

  // 启用 Chrome DevTools Protocol
  win.webContents.debugger.attach("1.3");

  // 加载应用
  if (process.env.NODE_ENV === "development") {
    // win.loadURL("http://localhost:8000");
    win.loadFile("./electron/index.html");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  // 创建右下角的托盘图标
  createTray(win, tray);

  win.on("closed", (e) => {
    closeShotScreenWin();
    // e.preventDefault(); // 阻止退出程序
    // win.setSkipTaskbar(true); // 取消任务栏显示
    // win.hide(); // 隐藏主程序窗口
  });

  mainWindow = win; // 将创建的窗口赋值给 mainWindow

  // 仅在开发环境下启用调试工具
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  return win;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  // 注册快捷键
  createShortcutKeys(mainWindow);

  // 注册全局快捷键
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    if (mainWindow) {
      // mainWindow.webContents.send("ss:open-win");
      closeShotScreenWin();
      mainWindow.hide();
      openShotScreenWin();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 在应用退出时注销快捷键
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("ss:open-win", () => {
  closeShotScreenWin();
  mainWindow.hide();
  openShotScreenWin();
});

ipcMainFn(mainWindow);
