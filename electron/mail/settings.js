const yaml = require("js-yaml");
const path = require("path");
const fs = require("node:fs");

const mailYamlPath = path.join(__dirname, "./setting.yaml");

function mailSettings(config) {
  const yamlStr = yaml.dump([config]); //转为yaml字符串
  console.log(yamlStr, "yamlStr----------------", mailYamlPath);
  // 写入相关文件中
  fs.writeFile(mailYamlPath, yamlStr, (err) => {
    if (err) throw err;
    console.log("设置成功");
  });
}
module.exports = {
  mailSettings,
};
