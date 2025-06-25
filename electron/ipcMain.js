const {
  ipcMain,
  desktopCapturer,
  BrowserWindow,
  clipboard,
  shell,
} = require("electron");
const fs = require("fs");
const {
  closeShotScreenWin,
  openShotScreenWin,
  downloadURLShotScreenWin,
  getScreenSize,
  guid,
} = require("./utils");
const { sendEmail } = require("./mail/send"); //发送邮件的工具
const { scheduleTask, cancelSingleTask } = require("./schedule/index");
const { mailSettings } = require("./mail/settings");
const { identifyImage } = require("./iconicIiteracy/index");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // 引入 uuid

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

  // 处理打开外部链接
  ipcMain.on("open-external-link", async (event, url) => {
    try {
      // 使用shell模块打开外部链接
      await shell.openExternal(url);
      console.log(`成功打开链接: ${url}`);
    } catch (error) {
      console.error(`打开链接失败: ${url}`, error);
      // 可以在这里发送错误消息回渲染进程
      event.reply("open-external-link-error", {
        url,
        error: error.message,
      });
    }
  });

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

  ipcMain.on("ss:close-win", () => {
    closeShotScreenWin();
  });

  ipcMain.on("ss:save-img", async (e, downloadUrl) => {
    downloadURLShotScreenWin(downloadUrl);
    await openViewImageWin(downloadUrl);
  });
  // 发送邮件状态的公共函数
  const commonSendEmail = async (
    e,
    data,
    resultMsg = "ss:schedule-email-reply",
    sendMsgType = "定时邮件"
  ) => {
    try {
      const res = await sendEmail(data);
      console.log(`${sendMsgType}发送成功了吗？`, res);
      e.reply(resultMsg, {
        status: "success",
        data: res,
        emailType: sendMsgType, // 添加邮件类型标记
      });
    } catch (error) {
      console.error(`${sendMsgType}发送失败:`, error);
      e.reply(resultMsg, {
        status: "failed",
        error: error.message,
        emailType: sendMsgType, // 添加邮件类型标记
      });
    }
  };
  // 发送邮件
  ipcMain.on("ss:send-email", async (e, data) => {
    console.log(data, "邮件信息");
    await commonSendEmail(e, data, "ss:send-email-reply", "即时邮件");
  });
  // 定时发送
  ipcMain.on("ss:schedule-email", (e, data) => {
    try {
      const taskId = guid();
      e.reply("ss:schedule-email-reply", {
        status: "pending",
        data: { taskId },
        emailType: "定时邮件",
      });

      const job = scheduleTask(
        {
          notificationMode: "yyds",
          notificationTime: 17,
          notificationRule: data?.cronValue,
          taskId,
          notificationContent: `定时邮件任务 ${taskId}`,
          notificationTitle: "定时邮件提醒",
        },
        async () => {
          try {
            const res = await sendEmail(data);
            console.log(`定时邮件发送成功了吗？`, res);
            // 定时邮件发送成功，通过广播通知所有窗口更新状态
            BrowserWindow.getAllWindows().forEach((win) => {
              if (!win.isDestroyed()) {
                win.webContents.send("ss:schedule-email-executed", {
                  taskId,
                  status: "success",
                  data: res,
                  emailType: "定时邮件",
                });
              }
            });
          } catch (error) {
            console.error(`定时邮件发送失败:`, error);
            // 定时邮件发送失败，通过广播通知所有窗口更新状态
            BrowserWindow.getAllWindows().forEach((win) => {
              if (!win.isDestroyed()) {
                win.webContents.send("ss:schedule-email-executed", {
                  taskId,
                  status: "failed",
                  error: error.message,
                  emailType: "定时邮件",
                });
              }
            });
          }
        }
      );

      // 存储任务信息
      if (job) {
        console.log(`定时任务 ${taskId} 创建成功`);
      } else {
        throw new Error("定时任务创建失败");
      }
    } catch (error) {
      console.error("创建定时任务失败:", error);
      e.reply("ss:schedule-email-reply", {
        status: "failed",
        error: error.message,
        emailType: "定时邮件",
      });
    }
  });
  // 取消单个定时任务
  ipcMain.on("ss:schedule-cancel", (e, { taskId }) => {
    console.log(taskId, "取消应答");
    try {
      const result = cancelSingleTask(taskId);
      if (result.success) {
        e.reply("ss:schedule-cancel-reply", {
          status: "success",
          taskId,
        });
      } else {
        e.reply("ss:schedule-cancel-reply", {
          status: "failed",
          error: result.error || "取消任务失败，但未提供明确原因。",
          taskId,
        });
      }
    } catch (error) {
      console.error("取消定时任务失败:", error);
      e.reply("ss:schedule-cancel-reply", {
        status: "failed",
        error: error.message,
        taskId,
      });
    }
  });
  // 邮箱设置
  ipcMain.on("ss:settings-email", async (e, data) => {
    mailSettings(data);
  });
  // 识图
  ipcMain.on("ss:identify-img", async () => {
    // base64图片编码
    const imageSrc = clipboard.readImage().toDataURL();
    await identifyImage(imageSrc);
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
    // 如果有旧窗口且未销毁，先关闭
    if (viewImageWin && !viewImageWin.isDestroyed()) {
      viewImageWin.close();
      viewImageWin = null;
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
      `http://localhost:8000/#/album/view-image?path=${encodeURIComponent(imageUrl)}`
    );
    // 打开控制台
    // viewImageWin.webContents.openDevTools();

    // 用 nativeImage 复制到剪贴板
    const { nativeImage } = require("electron");
    const image = nativeImage.createFromPath(imageUrl);
    clipboard.writeImage(image);

    viewImageWin.on("closed", () => {
      viewImageWin = null;
    });
  }

  // 处理保存背景图片请求 (修改逻辑)
  ipcMain.handle(
    "save-background-image",
    async (event, { imageData, fileName }) => {
      try {
        const customBgDir = path.join(
          __dirname,
          "../src/assets/custom-backgrounds"
        );
        const currentBgPath = path.join(__dirname, "../src/assets/bg.png");

        if (!fs.existsSync(customBgDir)) {
          fs.mkdirSync(customBgDir, { recursive: true });
        }

        const fileExtension = path.extname(fileName);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const targetFilePath = path.join(customBgDir, uniqueFileName);

        fs.writeFileSync(targetFilePath, Buffer.from(imageData, "base64"));
        fs.copyFileSync(targetFilePath, currentBgPath);

        console.log(`背景图片已保存到: ${targetFilePath}`);
        console.log(`已设置为当前背景: ${currentBgPath}`);
        // 返回完整的 file:// URL
        return {
          success: true,
          filePath: `file://${targetFilePath.replace(/\\/g, "/")}`,
        };
      } catch (error) {
        console.error("保存背景图片失败:", error);
        return { success: false, error: error.message };
      }
    }
  );

  // 获取已上传背景图片列表
  ipcMain.handle("get-background-images", async () => {
    try {
      const customBgDir = path.join(
        __dirname,
        "../src/assets/custom-backgrounds"
      );
      if (!fs.existsSync(customBgDir)) {
        return { success: true, images: [] };
      }

      const files = fs.readdirSync(customBgDir);
      const imageUrls = files.map((file) => {
        const filePath = path.join(customBgDir, file);
        return `file://${filePath.replace(/\\/g, "/")}`; // 返回完整的 file:// URL
      });
      return { success: true, images: imageUrls };
    } catch (error) {
      console.error("获取背景图片列表失败:", error);
      return { success: false, error: error.message, images: [] };
    }
  });

  // 设置激活的背景图片
  ipcMain.handle(
    "set-active-background-image",
    async (event, { imagePath }) => {
      try {
        const sourceFilePath = imagePath
          .replace(/^file:\/\//, "")
          .replace(/\//g, "\\"); // 转换为文件系统路径
        const targetPath = path.join(__dirname, "../src/assets/bg.png");

        if (!fs.existsSync(sourceFilePath)) {
          throw new Error("指定图片文件不存在。");
        }

        fs.copyFileSync(sourceFilePath, targetPath);
        console.log(`已将 ${imagePath} 设置为当前背景。`);
        return { success: true };
      } catch (error) {
        console.error("设置激活背景图片失败:", error);
        return { success: false, error: error.message };
      }
    }
  );

  // 删除背景图片
  ipcMain.handle("delete-background-image", async (event, { imagePath }) => {
    try {
      const filePathToDelete = imagePath
        .replace(/^file:\/\//, "")
        .replace(/\//g, "\\");
      const currentBgPath = path.join(__dirname, "../src/assets/bg.png");

      if (fs.existsSync(filePathToDelete)) {
        fs.unlinkSync(filePathToDelete);
        console.log(`背景图片已删除: ${filePathToDelete}`);

        // 如果删除的图片是当前激活的背景图，则清空 bg.png
        if (
          fs.existsSync(currentBgPath) &&
          path.resolve(currentBgPath) === path.resolve(filePathToDelete)
        ) {
          fs.writeFileSync(currentBgPath, ""); // 清空文件内容，或者可以复制一个默认的透明背景图
          console.log("当前背景图已清空。");
        }
        return { success: true };
      } else {
        throw new Error("要删除的图片文件不存在。");
      }
    } catch (error) {
      console.error("删除背景图片失败:", error);
      return { success: false, error: error.message };
    }
  });
}
module.exports = { ipcMainFn };
