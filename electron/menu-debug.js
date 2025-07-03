/**
 * 菜单调试工具
 * 用于强制显示和调试菜单
 * @author AI Assistant
 * @date 2024
 */

const { Menu, BrowserWindow, ipcMain } = require("electron");

/**
 * 强制创建并显示菜单
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function forceShowMenu(mainWindow) {
  console.log("🔧 强制显示菜单...");

  // 创建简单的测试菜单
  const template = [
    {
      label: "调试",
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
          label: "切换菜单栏",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              const isVisible = mainWindow.isMenuBarVisible();
              mainWindow.setMenuBarVisibility(!isVisible);
              console.log(`🔄 菜单栏状态: ${!isVisible ? "显示" : "隐藏"}`);
            }
          },
        },
        { type: "separator" },
        {
          label: "测试菜单项",
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
      label: "帮助",
      submenu: [
        {
          label: "关于菜单调试",
          click: () => {
            console.log("📖 菜单调试工具说明");
            console.log("- 按 Alt 键可以临时显示菜单");
            console.log("- 使用调试菜单可以控制菜单栏显示");
            console.log("- 检查控制台输出获取调试信息");
          },
        },
      ],
    },
  ];

  try {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // 强制显示菜单栏
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(true);
      console.log("✅ 调试菜单已创建并显示");
    }

    return true;
  } catch (error) {
    console.error("❌ 创建调试菜单失败:", error);
    return false;
  }
}

/**
 * 创建完整的功能菜单
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function createFullMenu(mainWindow) {
  console.log("🔧 创建完整功能菜单...");

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
            console.log("🆕 新建窗口");
          },
        },
        { type: "separator" },
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            console.log("🚪 退出应用");
            require("electron").app.quit();
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
        { type: "separator" },
        {
          label: "菜单调试",
          submenu: [
            {
              label: "显示菜单栏",
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.setMenuBarVisibility(true);
                  console.log("✅ 强制显示菜单栏");
                }
              },
            },
            {
              label: "隐藏菜单栏",
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.setMenuBarVisibility(false);
                  console.log("❌ 隐藏菜单栏");
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
          ],
        },
      ],
    },
  ];

  try {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // 强制显示菜单栏
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(true);
      console.log("✅ 完整功能菜单已创建并显示");
    }

    return true;
  } catch (error) {
    console.error("❌ 创建完整菜单失败:", error);
    return false;
  }
}

/**
 * 注册菜单调试IPC事件
 */
function registerMenuDebugEvents() {
  // 强制显示菜单
  ipcMain.handle("menu:force-show", async (event) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      return forceShowMenu(mainWindow);
    }
    return false;
  });

  // 创建完整菜单
  ipcMain.handle("menu:create-full", async (event) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      return createFullMenu(mainWindow);
    }
    return false;
  });

  // 获取菜单状态
  ipcMain.handle("menu:get-status", async (event) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      return {
        isVisible: mainWindow.isMenuBarVisible(),
        isDestroyed: mainWindow.isDestroyed(),
        windowCount: windows.length,
      };
    }
    return { isVisible: false, isDestroyed: true, windowCount: 0 };
  });
}

module.exports = {
  forceShowMenu,
  createFullMenu,
  registerMenuDebugEvents,
};
