import React, { useState, useEffect } from "react";
import { Card, Button, message, Spin, Typography, Space } from "antd";
import {
  QrcodeOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "umi";
import "./qrcode.less";

const { Title, Text } = Typography;

const QrCodeLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loginStatus, setLoginStatus] = useState<
    "waiting" | "scanning" | "success" | "expired"
  >("waiting");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时

  // 生成二维码
  const generateQrCode = async () => {
    setLoading(true);
    try {
      // 模拟生成二维码的API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const token = `login-token-${Date.now()}`;
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${token}`
      );
      setLoginStatus("waiting");
      setCountdown(300);
    } catch (error) {
      message.error("生成二维码失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 模拟检查登录状态
  const checkLoginStatus = async () => {
    // 这里应该调用后端API检查扫码状态
    // 模拟不同的状态变化
    const statuses: Array<"waiting" | "scanning" | "success" | "expired"> = [
      "waiting",
      "scanning",
      "success",
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    if (randomStatus === "success") {
      message.success("登录成功！");
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } else if (randomStatus === "scanning") {
      setLoginStatus("scanning");
      message.info("检测到扫码，请在手机上确认登录");
    }
  };

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0 && loginStatus === "waiting") {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setLoginStatus("expired");
    }
  }, [countdown, loginStatus]);

  // 定期检查登录状态
  useEffect(() => {
    if (loginStatus === "waiting" && qrCodeUrl) {
      const interval = setInterval(checkLoginStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [loginStatus, qrCodeUrl]);

  // 初始化生成二维码
  useEffect(() => {
    generateQrCode();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (loginStatus) {
      case "waiting":
        return "请使用手机扫描二维码登录";
      case "scanning":
        return "检测到扫码，请在手机上确认登录";
      case "success":
        return "登录成功，正在跳转...";
      case "expired":
        return "二维码已过期，请重新生成";
      default:
        return "请使用手机扫描二维码登录";
    }
  };

  const getStatusColor = () => {
    switch (loginStatus) {
      case "waiting":
        return "#1890ff";
      case "scanning":
        return "#52c41a";
      case "success":
        return "#52c41a";
      case "expired":
        return "#ff4d4f";
      default:
        return "#1890ff";
    }
  };

  return (
    <div className="qrcode-login-container">
      <div className="qrcode-login-content">
        <div className="qrcode-login-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/login")}
            className="back-button"
          >
            返回
          </Button>
          <Title level={2} className="page-title">
            扫码登录
          </Title>
        </div>

        <Card className="qrcode-card" bordered={false}>
          <div className="qrcode-content">
            {loading ? (
              <div className="qrcode-loading">
                <Spin size="large" />
                <Text>正在生成二维码...</Text>
              </div>
            ) : loginStatus === "expired" ? (
              <div className="qrcode-expired">
                <QrcodeOutlined className="expired-icon" />
                <Text type="danger">二维码已过期</Text>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={generateQrCode}
                  className="refresh-button"
                >
                  重新生成
                </Button>
              </div>
            ) : (
              <>
                <div className="qrcode-wrapper">
                  <img
                    src={qrCodeUrl}
                    alt="登录二维码"
                    className="qrcode-image"
                  />
                  {loginStatus === "scanning" && (
                    <div className="scanning-overlay">
                      <div className="scanning-animation"></div>
                    </div>
                  )}
                </div>

                <div className="qrcode-info">
                  <Text
                    className="status-text"
                    style={{ color: getStatusColor() }}
                  >
                    {getStatusText()}
                  </Text>

                  {loginStatus === "waiting" && (
                    <div className="countdown">
                      <Text type="secondary">
                        二维码有效期：{formatTime(countdown)}
                      </Text>
                    </div>
                  )}
                </div>

                <div className="qrcode-actions">
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={generateQrCode}
                      disabled={loading}
                    >
                      刷新二维码
                    </Button>
                    <Button type="link" onClick={() => navigate("/login")}>
                      使用密码登录
                    </Button>
                  </Space>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="qrcode-tips">
          <Title level={4}>使用说明</Title>
          <ul>
            <li>打开手机上的应用</li>
            <li>点击"扫一扫"功能</li>
            <li>扫描页面上的二维码</li>
            <li>在手机上确认登录</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QrCodeLoginPage;
