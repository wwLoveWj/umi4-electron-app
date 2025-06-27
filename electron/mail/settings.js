const yaml = require("js-yaml");
const path = require("path");
const fs = require("node:fs");

const mailYamlPath = path.join(__dirname, "./setting.yaml");

/**
 * 读取邮箱配置
 * @returns {Object|null} 邮箱配置对象或null
 */
function readMailSettings() {
  try {
    if (!fs.existsSync(mailYamlPath)) {
      console.log("邮箱配置文件不存在");
      return null;
    }

    const yamlContent = fs.readFileSync(mailYamlPath, "utf8");
    const configs = yaml.load(yamlContent);

    // 返回第一个配置（如果有多个配置，取第一个）
    return Array.isArray(configs) && configs.length > 0 ? configs[0] : null;
  } catch (error) {
    console.error("读取邮箱配置失败:", error);
    return null;
  }
}

/**
 * 保存邮箱配置
 * @param {Object} config 邮箱配置对象
 */
function mailSettings(config) {
  try {
    const yamlStr = yaml.dump([config]); // 转为yaml字符串
    console.log("保存邮箱配置:", yamlStr);
    console.log("配置文件路径:", mailYamlPath);

    // 写入相关文件中
    fs.writeFileSync(mailYamlPath, yamlStr, "utf8");
    console.log("邮箱设置保存成功");
  } catch (error) {
    console.error("保存邮箱配置失败:", error);
    throw error;
  }
}

module.exports = {
  mailSettings,
  readMailSettings,
};
