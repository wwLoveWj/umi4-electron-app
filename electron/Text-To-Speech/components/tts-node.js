/**
 * Node.js TTS文本朗读组件（替代edge-tts）
 * 使用Windows内置TTS进行文本朗读
 * @author AI Assistant
 * @date 2024
 */

const { ipcMain, BrowserWindow, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let mainWindow;
let settingsWindow;
let ttsConfig = {};
let currentProcess = null;
const CONFIG_FILE = path.join(__dirname, "../config/tts-config.yaml");

/**
 * 初始化TTS组件
 * @param {BrowserWindow} window - 主窗口实例
 */
function initialize(window) {
  mainWindow = window;

  // 加载配置文件
  loadConfig();

  // 注册IPC事件处理器
  registerIPCHandlers();

  console.log("Node.js TTS组件初始化完成");
}

/**
 * 注册IPC事件处理器
 */
function registerIPCHandlers() {
  // 获取可用音色列表
  ipcMain.handle("tts:get-voices", async (event) => {
    try {
      const voices = await getAvailableVoices();
      return { success: true, voices };
    } catch (error) {
      console.error("获取音色列表失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 朗读文本
  ipcMain.handle("tts:synthesize", async (event, options) => {
    try {
      const result = await synthesizeText(options);
      return { success: true, result };
    } catch (error) {
      console.error("文本朗读失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 停止朗读
  ipcMain.handle("tts:stop", async (event) => {
    try {
      await stopReading();
      return { success: true };
    } catch (error) {
      console.error("停止朗读失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 批量朗读
  ipcMain.handle("tts:batch-read", async (event, options) => {
    try {
      const result = await batchReadTexts(options);
      return { success: true, result };
    } catch (error) {
      console.error("批量朗读失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 朗读文章
  ipcMain.handle("tts:read-article", async (event, options = {}) => {
    try {
      const result = await readTestArticle();
      return { success: true, result };
    } catch (error) {
      console.error("朗读文章失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 朗读自定义文本
  ipcMain.handle("tts:read-custom-text", async (event, options = {}) => {
    try {
      const { text, voice, rate, volume, pitch } = options;
      const paragraphs = splitTextIntoParagraphs(text, 500);

      const result = await batchReadTexts({
        texts: paragraphs,
        voice: voice || ttsConfig.default?.voice || "Microsoft Huihui",
        rate: rate || ttsConfig.default?.rate || 1.0,
        volume: volume || ttsConfig.default?.volume || 1.0,
        pitch: pitch || ttsConfig.default?.pitch || 1.0,
        interval: 1000,
      });

      return { success: true, result };
    } catch (error) {
      console.error("朗读自定义文本失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 保存TTS配置
  ipcMain.handle("tts:save-config", async (event, config) => {
    try {
      await saveConfig(config);
      return { success: true };
    } catch (error) {
      console.error("保存TTS配置失败:", error);
      return { success: false, error: error.message };
    }
  });

  // 读取TTS配置
  ipcMain.handle("tts:read-config", async (event) => {
    try {
      return { success: true, config: ttsConfig };
    } catch (error) {
      console.error("读取TTS配置失败:", error);
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
      ttsConfig = yaml.load(configContent);
    } else {
      // 创建默认配置
      ttsConfig = {
        default: {
          voice: "Microsoft Huihui Desktop",
          rate: 1.0,
          volume: 1.0,
          pitch: 1.0,
        },
        customVoices: [],
        autoPlay: true,
        saveAudio: false,
        audioPath: path.join(process.cwd(), "audio"),
      };
      saveConfig(ttsConfig);
    }
  } catch (error) {
    console.error("加载TTS配置文件失败:", error);
    ttsConfig = {};
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
    ttsConfig = config;

    console.log("TTS配置保存成功");
  } catch (error) {
    console.error("保存TTS配置文件失败:", error);
    throw error;
  }
}

/**
 * 获取可用音色列表
 * @returns {Promise<Array>} 音色列表
 */
async function getAvailableVoices() {
  return new Promise((resolve, reject) => {
    const voices = [
      {
        name: "微软慧慧",
        value: "Microsoft Huihui Desktop",
        language: "zh-CN",
      },
      { name: "微软Zira", value: "Microsoft Zira Desktop", language: "en-US" },
      { name: "默认音色", value: "", language: "auto" },
    ];

    // 如果有自定义音色，添加到列表中
    if (ttsConfig.customVoices && ttsConfig.customVoices.length > 0) {
      voices.push(...ttsConfig.customVoices);
    }

    resolve(voices);
  });
}

/**
 * 合成文本为语音（使用Windows内置TTS）
 * @param {Object} options - 合成选项
 * @returns {Promise<Object>} 合成结果
 */
async function synthesizeText(options = {}) {
  const {
    text,
    voice = ttsConfig.default?.voice || "Microsoft Huihui Desktop",
    rate = ttsConfig.default?.rate || 1.0,
    volume = ttsConfig.default?.volume || 1.0,
    pitch = ttsConfig.default?.pitch || 1.0,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // 停止当前播放
      if (currentProcess) {
        currentProcess.kill();
      }

      // 使用PowerShell调用Windows内置TTS
      const { spawn } = require("child_process");

      // 构建PowerShell命令
      const psCommand = `
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        ${
          voice
            ? `try {
          $synthesizer.SelectVoice("${voice}")
        } catch {
          Write-Host "使用默认音色"
        }`
            : 'Write-Host "使用默认音色"'
        }
        $synthesizer.Rate = ${Math.round((rate - 1) * 10)}
        $synthesizer.Volume = ${Math.round(volume * 100)}
        $synthesizer.Speak("${text.replace(/"/g, '\\"')}")
        $synthesizer.Dispose()
      `;

      // 启动PowerShell进程
      currentProcess = spawn("powershell", ["-Command", psCommand], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      currentProcess.stdout.on("data", (data) => {
        console.log("TTS输出:", data.toString());
      });

      currentProcess.stderr.on("data", (data) => {
        console.error("TTS错误:", data.toString());
      });

      currentProcess.on("close", (code) => {
        if (code === 0) {
          resolve({
            success: true,
            text: text,
            voice: voice,
            duration: text.length * 0.3, // 估算时长
          });
        } else {
          reject(new Error(`TTS进程退出，代码: ${code}`));
        }
      });

      currentProcess.on("error", (error) => {
        reject(new Error(`启动TTS失败: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 停止朗读
 */
async function stopReading() {
  return new Promise((resolve) => {
    if (currentProcess) {
      currentProcess.kill();
      currentProcess = null;
    }
    resolve();
  });
}

/**
 * 批量朗读文本
 * @param {Object} options - 批量朗读选项
 * @returns {Promise<Array>} 朗读结果
 */
async function batchReadTexts(options = {}) {
  const { texts, voice, rate, volume, pitch, interval = 1000 } = options;
  const results = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await synthesizeText({
        text: texts[i],
        voice,
        rate,
        volume,
        pitch,
      });

      results.push({
        index: i,
        text: texts[i],
        success: true,
        result,
      });

      // 通知主窗口进度
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("tts:batch-progress", {
          index: i,
          total: texts.length,
          text: texts[i],
          result,
        });
      }

      // 等待间隔时间
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    } catch (error) {
      results.push({
        index: i,
        text: texts[i],
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * 读取测试文章
 */
async function readTestArticle() {
  try {
    const articlePath = path.join(__dirname, "../articles/test-article.txt");

    if (!fs.existsSync(articlePath)) {
      console.error("测试文章文件不存在:", articlePath);
      return;
    }

    const articleContent = fs.readFileSync(articlePath, "utf8");
    console.log("📖 开始朗读测试文章...");

    // 将文章分段，每段不超过500字符
    const paragraphs = splitTextIntoParagraphs(articleContent, 500);

    // 开始批量朗读
    const result = await batchReadTexts({
      texts: paragraphs,
      voice: ttsConfig.default?.voice || "Microsoft Huihui Desktop",
      rate: ttsConfig.default?.rate || 1.0,
      volume: ttsConfig.default?.volume || 1.0,
      pitch: ttsConfig.default?.pitch || 1.0,
      interval: 1000, // 段落间隔1秒
    });

    console.log("✅ 文章朗读完成");

    // 通知主窗口朗读完成
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tts:article-completed", {
        totalParagraphs: paragraphs.length,
        result: result,
      });
    }
  } catch (error) {
    console.error("❌ 朗读文章失败:", error);

    // 通知主窗口朗读失败
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tts:article-error", {
        error: error.message,
      });
    }
  }
}

/**
 * 将文本分段
 * @param {string} text - 要分段的文本
 * @param {number} maxLength - 每段最大长度
 * @returns {Array} 分段后的文本数组
 */
function splitTextIntoParagraphs(text, maxLength = 500) {
  const paragraphs = [];
  const sentences = text.split(/[。！？；]/).filter((s) => s.trim());

  let currentParagraph = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentParagraph.length + trimmedSentence.length <= maxLength) {
      currentParagraph += trimmedSentence + "。";
    } else {
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
      }
      currentParagraph = trimmedSentence + "。";
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

/**
 * 打开设置窗口
 */
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "TTS朗读设置",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载设置页面
  if (process.env.NODE_ENV === "development") {
    settingsWindow.loadURL("http://localhost:8000/#/setting?tab=tts");
  } else {
    settingsWindow.loadFile(path.join(__dirname, "../../dist/index.html"), {
      hash: "/setting?tab=tts",
    });
  }

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

/**
 * 开始朗读（菜单调用）
 */
function startReading() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // 读取测试文章并开始朗读
    readTestArticle();
  }
}

/**
 * 清理组件资源
 */
function cleanup() {
  if (currentProcess) {
    currentProcess.kill();
  }

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }

  console.log("Node.js TTS组件资源已清理");
}

module.exports = {
  initialize,
  cleanup,
  openSettingsWindow,
  startReading,
  readArticle: readTestArticle,
};
