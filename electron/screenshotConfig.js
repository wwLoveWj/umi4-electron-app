const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");

const configPath = path.join(__dirname, "./screenshot/config.yaml");

// 读取配置
ipcMain.handle("get-config-yaml", async () => {
  if (!fs.existsSync(configPath)) return {};
  return yaml.load(fs.readFileSync(configPath, "utf8")) || {};
});

// 局部更新配置
ipcMain.handle("update-config-yaml", async (event, partial) => {
  let config = {};
  if (fs.existsSync(configPath)) {
    config = yaml.load(fs.readFileSync(configPath, "utf8")) || {};
  }
  config = { ...config, ...partial }; // 只更新相关字段
  fs.writeFileSync(configPath, yaml.dump(config));
  return true;
});

// 选择文件夹
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled || !result.filePaths.length) return "";
  return result.filePaths[0];
});
