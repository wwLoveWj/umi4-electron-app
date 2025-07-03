/**
 * 主进程组件入口文件
 * 整合登录二维码、Puppeteer配置、TTS接口等功能模块
 * @author AI Assistant
 * @date 2024
 */

const { app, Menu, BrowserWindow } = require("electron");
const path = require("path");

// 导入各个功能模块
const qrCodeHandler = require("./qrcode");
const puppeteerHandler = require("./puppeteer");
const ttsHandler = require("./tts-node");

/**
 * 初始化所有组件
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function initializeComponents(mainWindow) {
  // 初始化各个功能模块
  qrCodeHandler.initialize(mainWindow);
  puppeteerHandler.initialize(mainWindow);
  ttsHandler.initialize(mainWindow);

  // 创建应用菜单
  createApplicationMenu();

  console.log("所有组件初始化完成");
}

/**
 * 创建应用菜单
 */
function createApplicationMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        {
          label: "新建窗口",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            const newWindow = new BrowserWindow({
              width: 800,
              height: 600,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
              },
            });
            newWindow.loadURL("http://localhost:8000");
          },
        },
        { type: "separator" },
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "功能",
      submenu: [
        {
          label: "二维码登录",
          submenu: [
            {
              label: "生成二维码",
              click: () => {
                qrCodeHandler.generateQRCode();
              },
            },
            {
              label: "检查登录状态",
              click: () => {
                qrCodeHandler.checkLoginStatus();
              },
            },
          ],
        },
        {
          label: "网页截图",
          submenu: [
            {
              label: "配置截图",
              click: () => {
                puppeteerHandler.openConfigWindow();
              },
            },
            {
              label: "执行截图",
              click: () => {
                puppeteerHandler.executeScreenshot();
              },
            },
          ],
        },
        {
          label: "文本朗读",
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
                  // 兼容旧版本，直接调用startReading
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
                testWindow.loadFile(
                  path.join(__dirname, "../../tts-test.html")
                );
              },
            },
          ],
        },
      ],
    },
    {
      label: "开发",
      submenu: [
        {
          label: "开发者工具",
          accelerator: "F12",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 清理所有组件资源
 */
function cleanupComponents() {
  qrCodeHandler.cleanup();
  puppeteerHandler.cleanup();
  ttsHandler.cleanup();
  console.log("所有组件资源已清理");
}

module.exports = {
  initializeComponents,
  cleanupComponents,
};
