/**
 * 依赖包更新脚本
 * 自动添加新功能所需的依赖包到package.json
 * @author AI Assistant
 * @date 2024
 */

const fs = require("fs");
const path = require("path");

/**
 * 新功能所需的依赖包
 */
const newDependencies = {
  // 二维码生成
  qrcode: "^1.5.3",

  // UUID生成
  uuid: "^9.0.1",

  // YAML配置文件处理
  "js-yaml": "^4.1.0",

  // Puppeteer网页截图
  puppeteer: "^21.5.2",

  // 文本朗读（edge-tts）
  "edge-tts": "^0.1.0",
};

/**
 * 开发依赖包
 */
const newDevDependencies = {
  // 类型定义
  "@types/qrcode": "^1.5.5",
  "@types/uuid": "^9.0.7",
  "@types/js-yaml": "^4.0.9",
};

/**
 * 更新package.json文件
 */
function updatePackageJson() {
  const packagePath = path.join(__dirname, "package.json");

  if (!fs.existsSync(packagePath)) {
    console.error("package.json文件不存在");
    return;
  }

  try {
    const packageContent = fs.readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(packageContent);

    // 添加新的依赖包
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }

    Object.keys(newDependencies).forEach((dep) => {
      if (!packageJson.dependencies[dep]) {
        packageJson.dependencies[dep] = newDependencies[dep];
        console.log(`添加依赖: ${dep}@${newDependencies[dep]}`);
      }
    });

    // 添加新的开发依赖包
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }

    Object.keys(newDevDependencies).forEach((dep) => {
      if (!packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = newDevDependencies[dep];
        console.log(`添加开发依赖: ${dep}@${newDevDependencies[dep]}`);
      }
    });

    // 保存更新后的package.json
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log("package.json更新完成");
  } catch (error) {
    console.error("更新package.json失败:", error);
  }
}

/**
 * 生成安装命令
 */
function generateInstallCommand() {
  const deps = Object.keys(newDependencies)
    .map((dep) => `${dep}@${newDependencies[dep]}`)
    .join(" ");
  const devDeps = Object.keys(newDevDependencies)
    .map((dep) => `${dep}@${newDevDependencies[dep]}`)
    .join(" ");

  console.log("\n=== 安装命令 ===");
  console.log(`# 安装生产依赖`);
  console.log(`npm install ${deps}`);
  console.log(`# 或使用yarn`);
  console.log(`yarn add ${deps}`);

  if (devDeps) {
    console.log(`\n# 安装开发依赖`);
    console.log(`npm install -D ${devDeps}`);
    console.log(`# 或使用yarn`);
    console.log(`yarn add -D ${devDeps}`);
  }

  console.log(`\n# 一键安装所有依赖`);
  console.log(`npm install`);
  console.log(`# 或使用yarn`);
  console.log(`yarn install`);
}

/**
 * 生成README文档
 */
function generateReadme() {
  const readmeContent = `# Electron 功能组件集成

## 新增功能

### 1. 二维码登录组件
- 生成登录二维码
- 管理登录状态
- 处理H5端扫码回调
- 支持轮询检查登录状态

### 2. Puppeteer网页截图组件
- 配置化截图任务
- 支持批量截图
- YAML配置文件管理
- 多种截图选项

### 3. TTS文本朗读组件
- 支持多种音色
- 批量朗读功能
- 音频文件保存
- 快捷键控制

## 安装依赖

\`\`\`bash
# 安装生产依赖
npm install qrcode@^1.5.3 uuid@^9.0.1 js-yaml@^4.1.0 puppeteer@^21.5.2 edge-tts@^0.1.0

# 安装开发依赖
npm install -D @types/qrcode@^1.5.5 @types/uuid@^9.0.7 @types/js-yaml@^4.0.9
\`\`\`

## 使用方法

### 二维码登录
\`\`\`javascript
// 生成二维码
const { ipcRenderer } = require('electron');
const result = await ipcRenderer.invoke('qrcode:generate', {
  baseUrl: 'https://your-app.com',
  token: 'your-token'
});

// 检查登录状态
const status = await ipcRenderer.invoke('qrcode:check-status', sessionId);
\`\`\`

### Puppeteer截图
\`\`\`javascript
// 执行截图
const result = await ipcRenderer.invoke('puppeteer:screenshot', {
  url: 'https://example.com',
  savePath: './screenshots',
  viewport: { width: 1920, height: 1080 }
});

// 读取配置
const config = await ipcRenderer.invoke('puppeteer:read-config');
\`\`\`

### TTS朗读
\`\`\`javascript
// 朗读文本
const result = await ipcRenderer.invoke('tts:synthesize', {
  text: '要朗读的文本',
  voice: 'zh-CN-XiaoxiaoNeural',
  rate: 1.0,
  volume: 1.0,
  pitch: 1.0
});

// 获取音色列表
const voices = await ipcRenderer.invoke('tts:get-voices');
\`\`\`

## 配置文件

### 截图配置 (electron/config/screenshot-config.yaml)
\`\`\`yaml
default:
  url: "https://example.com"
  savePath: "./screenshots"
  viewport:
    width: 1920
    height: 1080
  options:
    fullPage: true
    quality: 90
    type: "jpeg"
\`\`\`

### TTS配置 (electron/config/tts-config.yaml)
\`\`\`yaml
default:
  voice: "zh-CN-XiaoxiaoNeural"
  rate: 1.0
  volume: 1.0
  pitch: 1.0

autoPlay: true
saveAudio: false
audioPath: "./audio"
\`\`\`

## 菜单集成

应用菜单已集成新功能：
- 功能 > 二维码登录
- 功能 > 网页截图  
- 功能 > 文本朗读

## 注意事项

1. 确保已安装edge-tts命令行工具
2. Puppeteer需要下载Chromium，首次运行可能较慢
3. 配置文件路径为相对路径，请根据实际情况调整
4. 所有组件都支持热重载，修改配置后重启应用即可生效
`;

  fs.writeFileSync(path.join(__dirname, "COMPONENTS_README.md"), readmeContent);
  console.log("README文档生成完成: COMPONENTS_README.md");
}

/**
 * 主函数
 */
function main() {
  console.log("开始更新依赖包...");

  updatePackageJson();
  generateInstallCommand();
  generateReadme();

  console.log("\n=== 更新完成 ===");
  console.log("请运行以下命令安装新依赖:");
  console.log("npm install");
  console.log("或");
  console.log("yarn install");
}

// 执行主函数
main();
