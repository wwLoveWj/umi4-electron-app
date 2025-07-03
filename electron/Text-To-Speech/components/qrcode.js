/**
 * 二维码登录功能组件
 * 负责生成二维码、管理登录状态、处理扫码回调
 * @author AI Assistant
 * @date 2024
 */

const { ipcMain, BrowserWindow, dialog } = require("electron");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let mainWindow;
let qrCodeWindow;
let currentSessionId;
let loginCheckInterval;

/**
 * 初始化二维码登录组件
 * @param {BrowserWindow} window - 主窗口实例
 */
function initialize(window) {
  mainWindow = window;

  // 注册IPC事件处理器
  registerIPCHandlers();

  console.log("二维码登录组件初始化完成");
}

/**
 * 注册IPC事件处理器
 */
function registerIPCHandlers() {
  // 生成二维码
  ipcMain.handle("qrcode:generate", async (event, options = {}) => {
    try {
      const sessionId = generateSessionId();
      const qrData = await generateQRCodeData(sessionId, options);
      return { success: true, sessionId, qrData };
    } catch (error) {
      console.error("生成二维码失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 检查登录状态
  ipcMain.handle("qrcode:check-status", async (event, sessionId) => {
    try {
      const status = await checkLoginStatus(sessionId);
      return { success: true, status };
    } catch (error) {
      console.error("检查登录状态失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 确认登录
  ipcMain.handle("qrcode:confirm-login", async (event, sessionId) => {
    try {
      const result = await confirmLogin(sessionId);
      return { success: true, result };
    } catch (error) {
      console.error("确认登录失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 监听H5端扫码回调
  ipcMain.on("qrcode:h5-callback", (event, data) => {
    handleH5Callback(data);
  });
}

/**
 * 生成会话ID
 * @returns {string} 会话ID
 */
function generateSessionId() {
  currentSessionId = uuidv4();
  return currentSessionId;
}

/**
 * 生成二维码数据
 * @param {string} sessionId - 会话ID
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} 二维码数据URL
 */
async function generateQRCodeData(sessionId, options = {}) {
  const baseUrl = options.baseUrl || "https://your-app.com";
  const token = options.token || generateToken();

  // 构建二维码内容
  const qrContent = {
    sessionId,
    token,
    timestamp: Date.now(),
    action: "login",
  };

  const qrString = JSON.stringify(qrContent);

  // 生成二维码
  const qrDataURL = await QRCode.toDataURL(qrString, {
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return qrDataURL;
}

/**
 * 生成临时token
 * @returns {string} token
 */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 检查登录状态
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 登录状态
 */
async function checkLoginStatus(sessionId) {
  // 这里应该调用后端API检查登录状态
  // 示例实现
  try {
    const response = await fetch(`/api/qrcode/status/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("检查登录状态失败");
    }
  } catch (error) {
    console.error("检查登录状态错误:", error);
    return { status: "pending", message: "检查中..." };
  }
}

/**
 * 确认登录
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 登录结果
 */
async function confirmLogin(sessionId) {
  try {
    const response = await fetch("/api/qrcode/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    if (response.ok) {
      const data = await response.json();
      // 登录成功，通知主窗口
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("qrcode:login-success", data);
      }
      return data;
    } else {
      throw new Error("确认登录失败");
    }
  } catch (error) {
    console.error("确认登录错误:", error);
    throw error;
  }
}

/**
 * 处理H5端回调
 * @param {Object} data - 回调数据
 */
function handleH5Callback(data) {
  console.log("收到H5端回调:", data);

  if (data.sessionId && data.action === "scan") {
    // 开始轮询检查登录状态
    startLoginStatusPolling(data.sessionId);
  }
}

/**
 * 开始轮询登录状态
 * @param {string} sessionId - 会话ID
 */
function startLoginStatusPolling(sessionId) {
  if (loginCheckInterval) {
    clearInterval(loginCheckInterval);
  }

  loginCheckInterval = setInterval(async () => {
    try {
      const status = await checkLoginStatus(sessionId);

      if (status.status === "confirmed") {
        // 登录确认，停止轮询
        clearInterval(loginCheckInterval);

        // 通知主窗口登录成功
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("qrcode:login-success", status);
        }
      } else if (status.status === "expired") {
        // 二维码过期，停止轮询
        clearInterval(loginCheckInterval);

        // 通知主窗口二维码过期
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("qrcode:login-expired");
        }
      }
    } catch (error) {
      console.error("轮询登录状态失败:", error);
    }
  }, 2000); // 每2秒检查一次
}

/**
 * 生成二维码（菜单调用）
 */
function generateQRCode() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("qrcode:menu-generate");
  }
}

/**
 * 检查登录状态（菜单调用）
 */
function checkLoginStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("qrcode:menu-check-status");
  }
}

/**
 * 清理组件资源
 */
function cleanup() {
  if (loginCheckInterval) {
    clearInterval(loginCheckInterval);
  }

  if (qrCodeWindow && !qrCodeWindow.isDestroyed()) {
    qrCodeWindow.close();
  }

  console.log("二维码登录组件资源已清理");
}

module.exports = {
  initialize,
  cleanup,
  generateQRCode,
  checkLoginStatus,
};
