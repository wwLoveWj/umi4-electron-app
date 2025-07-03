/**
 * Puppeteer网页截图配置组件
 * 负责管理截图配置、执行截图任务、配置界面
 * @author AI Assistant
 * @date 2024
 */

const { ipcMain, BrowserWindow, dialog } = require("electron");
const puppeteer = require("puppeteer");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

let mainWindow;
let configWindow;
let screenshotConfig = {};
const CONFIG_FILE = path.join(__dirname, "../config/screenshot-config.yaml");

/**
 * 初始化Puppeteer组件
 * @param {BrowserWindow} window - 主窗口实例
 */
function initialize(window) {
  mainWindow = window;

  // 加载配置文件
  loadConfig();

  // 注册IPC事件处理器
  registerIPCHandlers();

  console.log("Puppeteer组件初始化完成");
}

/**
 * 注册IPC事件处理器
 */
function registerIPCHandlers() {
  // 读取配置
  ipcMain.handle("puppeteer:read-config", async (event) => {
    try {
      return { success: true, config: screenshotConfig };
    } catch (error) {
      console.error("读取配置失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 保存配置
  ipcMain.handle("puppeteer:save-config", async (event, config) => {
    try {
      await saveConfig(config);
      return { success: true };
    } catch (error) {
      console.error("保存配置失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 执行截图
  ipcMain.handle("puppeteer:screenshot", async (event, options) => {
    try {
      const result = await executeScreenshot(options);
      return { success: true, result };
    } catch (error) {
      console.error("执行截图失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 选择保存路径
  ipcMain.handle("puppeteer:select-save-path", async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (!result.canceled) {
        return { success: true, path: result.filePaths[0] };
      } else {
        return { success: false, error: "用户取消选择" };
      }
    } catch (error) {
      console.error("选择保存路径失败:", error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * 加载配置文件
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configContent = fs.readFileSync(CONFIG_FILE, "utf8");
      screenshotConfig = yaml.load(configContent);
    } else {
      // 创建默认配置
      screenshotConfig = {
        default: {
          url: "https://example.com",
          savePath: path.join(process.cwd(), "screenshots"),
          viewport: {
            width: 1920,
            height: 1080,
          },
          options: {
            fullPage: true,
            quality: 90,
            type: "jpeg",
          },
        },
        tasks: [],
      };
      saveConfig(screenshotConfig);
    }
  } catch (error) {
    console.error("加载配置文件失败:", error);
    screenshotConfig = {};
  }
}

/**
 * 保存配置文件
 * @param {Object} config - 配置对象
 */
async function saveConfig(config) {
  try {
    // 确保配置目录存在
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const yamlContent = yaml.dump(config);
    fs.writeFileSync(CONFIG_FILE, yamlContent, "utf8");
    screenshotConfig = config;

    console.log("配置保存成功");
  } catch (error) {
    console.error("保存配置文件失败:", error);
    throw error;
  }
}

/**
 * 执行截图任务
 * @param {Object} options - 截图选项
 * @returns {Promise<Object>} 截图结果
 */
async function executeScreenshot(options = {}) {
  const {
    url,
    savePath,
    viewport = { width: 1920, height: 1080 },
    screenshotOptions = {},
    taskName = "default",
  } = options;

  let browser;

  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // 设置视口
    await page.setViewport(viewport);

    // 设置用户代理
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // 导航到页面
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 确保保存目录存在
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${taskName}_${timestamp}.${screenshotOptions.type || "jpeg"}`;
    const filePath = path.join(savePath, fileName);

    // 执行截图
    await page.screenshot({
      path: filePath,
      fullPage: screenshotOptions.fullPage !== false,
      quality: screenshotOptions.quality || 90,
      type: screenshotOptions.type || "jpeg",
      ...screenshotOptions,
    });

    await browser.close();

    return {
      success: true,
      filePath,
      fileName,
      url,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error("截图执行失败:", error);
    throw error;
  }
}

/**
 * 打开配置窗口
 */
function openConfigWindow() {
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Puppeteer截图配置",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载配置页面
  if (process.env.NODE_ENV === "development") {
    configWindow.loadURL("http://localhost:8000/#/setting?tab=puppeteer");
  } else {
    configWindow.loadFile(path.join(__dirname, "../../dist/index.html"), {
      hash: "/setting?tab=puppeteer",
    });
  }

  configWindow.on("closed", () => {
    configWindow = null;
  });
}

/**
 * 执行截图（菜单调用）
 */
function executeScreenshot() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("puppeteer:menu-execute");
  }
}

/**
 * 批量执行截图任务
 * @param {Array} tasks - 任务列表
 * @returns {Promise<Array>} 执行结果
 */
async function executeBatchScreenshots(tasks) {
  const results = [];

  for (const task of tasks) {
    try {
      const result = await executeScreenshot(task);
      results.push({ ...result, taskName: task.name });

      // 通知主窗口进度
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("puppeteer:batch-progress", {
          taskName: task.name,
          result,
        });
      }

      // 任务间隔
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        success: false,
        taskName: task.name,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * 清理组件资源
 */
function cleanup() {
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.close();
  }

  console.log("Puppeteer组件资源已清理");
}

module.exports = {
  initialize,
  cleanup,
  openConfigWindow,
  executeScreenshot,
  executeBatchScreenshots,
};
