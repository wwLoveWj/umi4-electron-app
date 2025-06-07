// electron/main.js
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  nativeImage,
  dialog,
} = require("electron");
const {
  closeShotScreenWin,
  openShotScreenWin,
  checkAppVersionUpdate,
} = require("./utils");
const { ipcMainFn } = require("./ipcMain");
const { createTray, createShortcutKeys } = require("./utils/tray");
const path = require("path");
const process = require("process");
const fs = require("fs");
const extract = require("extract-zip");

// 打印环境变量，用于调试
console.log("当前环境:", process.env.NODE_ENV);

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
    // 以下两行是用来控制标题隐藏的
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    frame: true, //隐藏所有的边框，最小化那些
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
    win.loadURL("http://localhost:8000");
    // win.loadFile("./electron/index.html");
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
  // 解决窗口调用 hide() 和 show()  事件有明显闪屏现象
  app.commandLine.appendSwitch("wm-window-animations-disabled");

  mainWindow = createWindow();
  // 注册快捷键
  createShortcutKeys(mainWindow);
  // TODO:检查更新包
  // setTimeout(() => checkAppVersionUpdate(mainWindow), 1000);
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

// document.addEventListener("keydown", (event) => {
//   // 检测是否同时按下Ctrl + Shift + I,自动打开开发者模式
//   if (event.ctrlKey && event.shiftKey && event.key === "I") {
//     // 阻止默认行为
//     event.preventDefault();

//     // 导入electron的进程通信API
//     const { ipcRenderer } = require("electron");
//     // 设置应用的控制台打开/关闭
//     ipcRenderer.send("SET_CONSOLE");
//   }
// });

// electron的入口文件
// 监听主线程的打开/关闭控制台事件
ipcMain.on("SET_CONSOLE", () => {
  // 判断当前是否打开控制台
  const isOpen = mainWindow.webContents.isDevToolsOpened();

  // 根据当前控制台的状态选择关闭/打开控制台
  if (isOpen) {
    // 关闭控制台
    mainWindow.webContents.closeDevTools();
  } else {
    // 打开控制台
    mainWindow.webContents.openDevTools();
  }
});

// 处理获取下载路径的请求
ipcMain.handle("get-downloads-path", (event, { filename }) => {
  return app.getPath(filename);
});

// 处理保存对话框
ipcMain.handle("show-save-dialog", async (event, options) => {
  const { filePath } = await dialog.showSaveDialog(options);
  return filePath;
});

// 处理文件保存
ipcMain.handle("save-file", async (event, { content, path }) => {
  try {
    await fs.promises.writeFile(path, Buffer.from(content));
    return path; // 返回保存的文件路径，而不是 true
  } catch (error) {
    console.error("保存文件失败:", error);
    throw error;
  }
});

// 处理解压 zip 文件
ipcMain.handle("extract-zip", async (event, { zipPath, extractPath }) => {
  try {
    await extract(zipPath, { dir: extractPath });
    return { success: true };
  } catch (error) {
    console.error("解压文件失败:", error);
    return { success: false, error: error.message };
  }
});

// 添加 show-open-dialog 处理器
ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result.filePaths;
  } catch (error) {
    console.error("打开对话框失败:", error);
    throw error;
  }
});

ipcMainFn(mainWindow);
