/**
 * 菜单测试启动脚本
 * 用于快速测试菜单功能
 * @author AI Assistant
 * @date 2024
 */

const electron = require("electron");
const { app, BrowserWindow, Menu } = electron;
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "default",
    frame: true,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载测试页面
  mainWindow.loadFile(path.join(__dirname, "electron/menu-test.html"));

  // 强制显示菜单栏
  mainWindow.setMenuBarVisibility(true);

  // 打开开发者工具
  mainWindow.webContents.openDevTools();

  console.log("🔧 菜单测试窗口已创建");
}

function createTestMenu() {
  const template = [
    {
      label: "测试",
      submenu: [
        {
          label: "显示菜单栏",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.setMenuBarVisibility(true);
              console.log("✅ 菜单栏已显示");
            }
          },
        },
        {
          label: "隐藏菜单栏",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.setMenuBarVisibility(false);
              console.log("❌ 菜单栏已隐藏");
            }
          },
        },
        {
          label: "菜单状态",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              const isVisible = mainWindow.isMenuBarVisible();
              console.log(`📊 菜单栏状态: ${isVisible ? "显示" : "隐藏"}`);
            }
          },
        },
        { type: "separator" },
        {
          label: "测试点击",
          click: () => {
            console.log("🎯 测试菜单项被点击");
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("menu:test-click", {
                message: "菜单测试成功！",
                timestamp: new Date().toISOString(),
              });
            }
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
                console.log("🔐 生成二维码");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("qrcode:menu-generate");
                }
              },
            },
            {
              label: "检查登录状态",
              click: () => {
                console.log("🔍 检查登录状态");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("qrcode:menu-check-status");
                }
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
                console.log("⚙️ 配置截图");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("puppeteer:menu-config");
                }
              },
            },
            {
              label: "执行截图",
              click: () => {
                console.log("📸 执行截图");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("puppeteer:menu-execute");
                }
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
                console.log("🔊 朗读设置");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("tts:menu-settings");
                }
              },
            },
            {
              label: "开始朗读",
              click: () => {
                console.log("🎵 开始朗读");
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("tts:menu-start");
                }
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
              console.log("🛠️ 切换开发者工具");
            }
          },
        },
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
              console.log("🔄 重新加载页面");
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  console.log("✅ 测试菜单已创建");
}

app.whenReady().then(() => {
  console.log("🚀 应用启动中...");

  createWindow();
  createTestMenu();

  // 确保菜单栏显示
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(true);
      console.log("✅ 菜单栏强制显示");
    }
  }, 500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

console.log("📋 菜单测试脚本已启动");
console.log("💡 提示：");
console.log("1. 按 Alt 键可以临时显示菜单");
console.log("2. 检查控制台输出获取调试信息");
console.log("3. 使用测试菜单项验证功能");
