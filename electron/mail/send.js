const { createTransport, createTestAccount } = require("nodemailer");
const yaml = require("js-yaml");
const path = require("path");
const fs = require("node:fs");
const notifier = require("node-notifier");

// 读取yaml文件中的邮箱配置
const mailInfo = yaml.load(
  fs.readFileSync(path.join(__dirname, "./setting.yaml"), "utf-8")
);
/**
 * 邮件发送方法
 * @param {*} title       发送主题
 * @param {*} sendToWho  发送给谁
 * @param {*} content       发送的模板格式
 */
const sendEmail = async ({ sendToWho, title, content }) => {
  try {
    if (!mailInfo) {
      notifier.notify({
        title: "邮箱配置",
        message: "邮箱配置信息未设置！",
        sound: "Submarine",
        closeLabel: "CANCEL",
        actions: "OK",
      });
      return;
    }

    const { host, port, secure, user, pass, address, debug } = mailInfo[0];

    const transporter = createTransport({
      host, // 替换为你的 SMTP 服务器地址
      port, // 替换为你的 SMTP 服务器端口
      secure, // 如果使用 TLS，则设置为 true
      auth: {
        user, // 你的邮箱地址
        pass, // 你的授权码
      },
      // tls: {
      //   rejectUnauthorized: false, //认情况下，当值为 true 时，会严格验证 SSL/TLS 证书
      //   // 安全提示：
      //   // 在生产环境中，建议保持 rejectUnauthorized: true
      //   // 只有在确实遇到证书问题，且确认服务器安全的情况下，才设置为 false
      //   // 当前设置为 false 主要是为了开发调试方便
      // },
      // debug: debug,
    });

    // 验证连接
    await transporter.verify();
    console.log("SMTP 连接验证成功");

    // 发送邮件
    const info = await transporter.sendMail({
      from: {
        name: "系统",
        address, // 你的邮箱地址
      },
      to: sendToWho,
      subject: title,
      html: content,
    });

    console.log("邮件发送成功:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("邮件发送失败:", error);
    throw error;
  }
};

// sendEmail.js
// class EmailSender {
//   constructor(config) {
//     this.transporter = nodemailer.createTransport({
//       host: config.host,
//       port: config.port,
//       secure: config.secure, // true for 465, false for other ports
//       auth: {
//         user: config.auth.user,
//         pass: config.auth.pass,
//       },
//     });
//   }

//   async sendEmail(options) {
//     debugger;
//     try {
//       const info = await this.transporter.sendMail(options);
//       console.log("Message sent: %s", info.messageId);
//       return { success: true, messageId: info.messageId };
//     } catch (error) {
//       console.error("Error sending email:", error);
//       return { success: false, error: error.message };
//     }
//   }
// }

// 配置 SMTP 服务器信息
const config = {
  host: "smtp.163.com", // 替换为你的 SMTP 服务器地址
  port: 465, // 替换为你的 SMTP 服务器端口
  secure: true, // 如果使用 TLS，则设置为 true
  auth: {
    user: "xxx@163.com", // 你的邮箱地址
    pass: "xxxgfg", // 你的授权码
  },
};

// 定义邮件选项
const mailOptions = {
  from: '"Your Name" <your-email@example.com>', // 发件人
  to: "recipient@example.com", // 收件人
  subject: "Hello ✔", // 主题
  text: "Hello world?", // 纯文本内容
  html: "<b>Hello world?</b>", // HTML 内容
};

// 发送邮件
const sendEmail1 = ({ sendToWho, title, content }) => {
  // 创建 EmailSender 实例
  const emailSender = new EmailSender(config);
  debugger;
  return emailSender
    .sendEmail({
      from: {
        name: "系统",
        address: "xxxx@163.com", // 你的邮箱地址
      },
      to: sendToWho,
      subject: "问题",
      html: "<h1>Hello world?</h1>",
    })
    .then((response) => {
      if (response.success) {
        console.log(
          `Email sent successfully with message ID: ${response.messageId}`
        );

        // createNotification("邮件发送~~~~", {
        //   body: "发送成功了红红火火恍恍惚惚~",
        // });
      } else {
        console.error("Failed to send email:", response.error);
      }
    });
};
// const net = require("net");

// console.log(net.isIP("127.0.0.1")); // 应该输出 4 (IPv4)
// console.log(net.isIP("::1")); // 应该输出 6 (IPv6)
// console.log(net.isIP("invalid")); // 应该输出 0 (无效的 IP)

module.exports = { sendEmail };
