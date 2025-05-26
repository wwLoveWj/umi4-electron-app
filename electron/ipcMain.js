const {
  ipcMain,
  desktopCapturer,
  BrowserWindow,
  clipboard,
} = require("electron");
const fs = require("fs");
const {
  closeShotScreenWin,
  openShotScreenWin,
  downloadURLShotScreenWin,
  getScreenSize,
} = require("./utils");

let viewImageWin;

/**
 * 获取当前应用程序窗口的截图源
 * @returns {Promise<Array>} 返回当前窗口的截图源数组
 */
async function selfWindws() {
  try {
    // 获取所有窗口
    const windows = BrowserWindow.getAllWindows();
    const sources = [];

    // 遍历所有窗口获取截图源
    for (const win of windows) {
      if (!win.isDestroyed()) {
        const source = await desktopCapturer.getSources({
          types: ["window"],
          thumbnailSize: getScreenSize(),
          windowId: win.id,
        });
        sources.push(...source);
      }
    }

    return sources;
  } catch (error) {
    console.error("获取窗口截图源失败:", error);
    return [];
  }
}

function ipcMainFn(mainWindow) {
  // 链接参考：https://juejin.cn/post/7111115472182968327

  // 处理文件系统操作
  ipcMain.handle("check-file-exists", async (event, filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      console.error("检查文件存在失败:", error);
      return false;
    }
  });

  ipcMain.handle("read-file", async (event, filePath) => {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error("读取文件失败:", error);
      throw error;
    }
  });

  ipcMain.handle("write-file", async (event, { filePath, content }) => {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("写入文件失败:", error);
      throw error;
    }
  });

  // 截图
  ipcMain.handle("ss:get-shot-screen-img", async () => {
    const { width, height } = getScreenSize();
    const sources = [
      ...(await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width,
          height,
        },
      })),
    ];
    const source = sources.filter((e) => e.id == "screen:0:0")[0];
    const img = source.thumbnail.toDataURL();
    return img;
  });

  ipcMain.on("ss:open-win", () => {
    closeShotScreenWin();
    mainWindow.hide();
    openShotScreenWin();
  });

  ipcMain.on("ss:close-win", () => {
    closeShotScreenWin();
  });

  ipcMain.on("ss:save-img", async (e, downloadUrl) => {
    downloadURLShotScreenWin(downloadUrl);
    await openViewImageWin(downloadUrl);
  });

  ipcMain.on("ss:download-img", async (e, downloadUrl) => {
    downloadURLShotScreenWin(downloadUrl, true);
  });

  ipcMain.handle("ss:get-desktop-capturer-source", async () => {
    return [
      ...(await desktopCapturer.getSources({ types: ["screen"] })),
      ...(await selfWindws()),
    ];
  });

  // 监听打开图片查看窗口的请求
  ipcMain.on("OPEN_VIEW_IMAGE", (event, imagePath) => {
    openViewImageWin(imagePath);
  });

  // 监听关闭图片查看窗口的请求
  ipcMain.on("CLOSE_VIEW_IMAGE", () => {
    if (viewImageWin) {
      viewImageWin.close();
    }
  });

  /**
   * 打开图片查看窗口
   * @param {string} imageUrl - 图片URL（可以是 Blob URL 或文件路径）
   */
  async function openViewImageWin(imageUrl) {
    if (viewImageWin) {
      viewImageWin.close();
    }

    viewImageWin = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true, // 自动隐藏菜单栏
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, // 允许加载本地资源
        // backgroundThrottling: false, // 禁用背景节流
        // enableRemoteModule: true, // 启用远程模块
        // partition: "persist:view-image", // 使用持久化的会话分区
      },
    });

    // 在加载新页面时清除缓存
    // viewImageWin.webContents.session.clearCache();

    // 开发环境下加载本地服务
    viewImageWin.loadURL(
      `http://localhost:8000/#/album/view-image?path=${encodeURIComponent(
        imageUrl
      )}`
    );
    // 将截图复制到剪切板
    clipboard.writeImage(imageUrl);
    // 打开控制台
    // viewImageWin.webContents.openDevTools();
    viewImageWin.on("closed", () => {
      viewImageWin = null;
    });
  }
}
module.exports = { ipcMainFn };
