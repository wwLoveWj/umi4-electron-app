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
const {
  initializeComponents,
  cleanupComponents,
} = require("./Text-To-Speech/components");
const {
  forceShowMenu,
  createFullMenu,
  registerMenuDebugEvents,
} = require("./menu-debug");
const path = require("path");
const process = require("process");
const fs = require("fs");
const extract = require("extract-zip");
const { Document, Packer, Paragraph, ImageRun } = require("docx");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { createWorker } = require("tesseract.js");
const pdf2html = require("pdf2html");
require("./screenshotConfig");

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
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  } else {
    app.quit();
  }
  // 原文链接：https://blog.csdn.net/F520Hz/article/details/136544798
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // 保留菜单栏显示
    titleBarStyle: "default",
    frame: true,
    autoHideMenuBar: false, // 确保菜单栏不自动隐藏
    // 以下两行是用来控制标题隐藏的
    // titleBarStyle: "hidden",
    // ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    // frame: true, //隐藏所有的边框，最小化那些

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

  // 确保窗口完全加载后再初始化组件
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("窗口加载完成，开始初始化组件...");

    // 初始化所有组件
    initializeComponents(mainWindow);

    // 强制显示菜单栏
    mainWindow.setMenuBarVisibility(true);

    // 注册菜单调试事件
    registerMenuDebugEvents();

    // 如果组件菜单没有显示，强制创建调试菜单
    setTimeout(() => {
      if (!mainWindow.isMenuBarVisible()) {
        console.log("⚠️ 组件菜单未显示，创建调试菜单...");
        forceShowMenu(mainWindow);
      }
    }, 1000);

    console.log("组件初始化完成，菜单栏应该已显示");
  });

  // 注册快捷键
  createShortcutKeys(mainWindow);
  // TODO:检查更新包
  // setTimeout(() => checkAppVersionUpdate(mainWindow), 1000);
  // 注册全局快捷键
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    if (mainWindow) {
      // mainWindow.webContents.send("ss:open-win");
      // TODO: 暂时注释掉，因为截图功能需要优化
      // closeShotScreenWin();
      // mainWindow.hide();
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

// 应用退出时清理组件资源
app.on("before-quit", () => {
  cleanupComponents();
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

// 处理创建 Word 文档
ipcMain.handle("create-word-doc", async (event, { images, savePath }) => {
  try {
    // 创建文档
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: images.map((image) => {
            return new Paragraph({
              children: [
                new ImageRun({
                  data: Buffer.from(image.data, "base64"),
                  transformation: {
                    width: 500,
                    height: 300,
                  },
                }),
              ],
            });
          }),
        },
      ],
    });

    // 生成文档
    const buffer = await Packer.toBuffer(doc);
    await fs.promises.writeFile(savePath, buffer);

    return { success: true };
  } catch (error) {
    console.error("创建 Word 文档失败:", error);
    return { success: false, error: error.message };
  }
});

// PDF 转 Word 处理程序
ipcMain.handle("convert-pdf-to-word", async (event, { pdfs, savePath }) => {
  try {
    // 创建临时目录
    const tempDir = path.join(app.getPath("temp"), "pdf-to-word");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 处理每个 PDF 文件
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const pdfBuffer = Buffer.from(pdf.data, "base64");

      // 解析 PDF
      const pdfData = await pdfParse(pdfBuffer);

      // 创建文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: pdf.name,
                heading: "Heading1",
              }),
              new Paragraph({
                text: pdfData.text,
              }),
            ],
          },
        ],
      });

      // 生成文档
      const buffer = await Packer.toBuffer(doc);

      // 保存 Word 文档
      const outputPath =
        i === 0
          ? savePath
          : path.join(
              path.dirname(savePath),
              `${path.basename(savePath, ".docx")}_${i + 1}.docx`
            );
      await fs.promises.writeFile(outputPath, buffer);

      // 发送进度更新
      event.sender.send("pdf-to-word-progress", {
        progress: Math.round(((i + 1) / pdfs.length) * 100),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("PDF 转 Word 失败:", error);
    return { success: false, error: error.message };
  }
});

// PDF 转 HTML 处理
ipcMain.handle("convert-pdf-to-html", async (event, { pdfs, savePath }) => {
  try {
    // 创建临时目录
    const tempDir = path.join(app.getPath("temp"), "pdf-to-html-temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 处理每个 PDF 文件
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const pdfBuffer = Buffer.from(pdf.data, "base64");
      const pdfName = `pdf_${i + 1}.pdf`;
      const pdfPath = path.join(tempDir, pdfName);

      // 保存 PDF 文件
      fs.writeFileSync(pdfPath, pdfBuffer);

      // 转换 PDF 为 HTML
      const html = await pdf2html.html(pdfPath);

      // 生成输出文件名
      const outputFileName =
        pdfs.length === 1 ? "output.html" : `output_${i + 1}.html`;
      const outputPath = path.join(path.dirname(savePath), outputFileName);

      // 保存 HTML 文件
      fs.writeFileSync(outputPath, html);

      // 发送进度更新
      event.sender.send("pdf-to-html-progress", {
        current: i + 1,
        total: pdfs.length,
        message: `正在处理第 ${i + 1} 个文件...`,
      });
    }

    // 清理临时文件
    fs.rmSync(tempDir, { recursive: true, force: true });

    return { success: true, path: path.dirname(savePath) };
  } catch (error) {
    console.error("PDF 转 HTML 失败:", error);
    throw new Error(`转换失败: ${error.message}`);
  }
});

// 允许 geolocation 权限
app.on("web-contents-created", (event, contents) => {
  contents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (permission === "geolocation") {
        callback(true);
      } else {
        callback(false);
      }
    }
  );
});

ipcMainFn(mainWindow);
