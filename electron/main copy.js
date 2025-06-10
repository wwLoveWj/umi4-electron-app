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
const { Document, Packer, Paragraph, ImageRun } = require("docx");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { createWorker } = require("tesseract.js");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();

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

// pdf2htmlEX 安装绝对路径
const pdf2htmlEXPath = "W:\\pdf2htmlEX\\pdf2htmlEX.exe";

/**
 * 使用 pdf2htmlEX 将单个 PDF 文件转换为 HTML，保存到用户指定路径。
 * @param {Electron.IpcMainInvokeEvent} event - IPC 事件对象
 * @param {{ pdfs: Array<{data: string, name: string}>, savePath: string }} param1 - PDF 文件数组和保存路径
 * @returns {Promise<{ success: boolean, path: string }>} 转换结果
 */
ipcMain.handle("convert-pdf-to-html", async (event, { pdfs, savePath }) => {
  try {
    if (!pdfs || pdfs.length === 0) {
      throw new Error("未检测到PDF文件");
    }
    // 只处理单个 PDF 文件
    const pdf = pdfs[0];
    const pdfBuffer = Buffer.from(pdf.data, "base64");
    // 使用 mkdtempSync 创建一个唯一的临时目录，确保不会与之前的运行冲突
    const tempDir = fs.mkdtempSync(
      path.join(app.getPath("temp"), "pdf-to-html-")
    );

    const pdfPath = path.join(tempDir, "input.pdf");
    fs.writeFileSync(pdfPath, pdfBuffer);

    // 定义临时输出HTML文件的路径，在新的唯一临时目录下
    const tempHtmlPath = path.join(tempDir, "output.html");

    // 确保输出目录存在 (这里是用户选择的最终目录)
    const saveDir = path.dirname(savePath);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    console.log("接收到的 savePath:", savePath); // 新增的日志

    // 调用 pdf2htmlEX 生成 HTML，输出到临时目录
    const command = `"${pdf2htmlEXPath}" --data-dir "W:\\pdf2htmlEX\\data" --zoom 1.3 --embed-css 0 --embed-font 0 --embed-image 0 --embed-javascript 0 --process-outline 0 --fallback 1 "${pdfPath}" "${tempHtmlPath}"`;
    console.log("执行命令:", command);

    const { stdout, stderr } = await execPromise(command);

    console.log("pdf2htmlEX stdout:", stdout);
    console.log("pdf2htmlEX stderr:", stderr);

    // 将临时生成的HTML文件移动到用户选择的最终路径
    await fs.promises.rename(tempHtmlPath, savePath);

    // 清理临时文件
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { success: true, path: savePath };
  } catch (error) {
    console.error("pdf2htmlEX 执行失败:", error);
    console.error("失败原因:", error.message);
    // 如果有 stderr，也打印出来
    if (error.stderr) {
      console.error("pdf2htmlEX 命令错误输出 (stderr):", error.stderr);
    }
    throw new Error("pdf2htmlEX 执行失败: " + error.message);
  }
});

ipcMainFn(mainWindow);
