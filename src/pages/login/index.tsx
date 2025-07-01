import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Space,
  Tooltip,
  Spin,
  Typography,
  Tabs,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  QrcodeOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "umi";
import PasswordStrength from "./components/PasswordStrength";
import { QRCodeSVG } from "qrcode.react";
import "./style.less";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface LoginFormData {
  username: string;
  password: string;
}

const BASE_QR_URL = "http://localhost:8001/#/qrDebug";

function getSessionId() {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"password" | "qrcode">("password");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeStatus, setQrCodeStatus] = useState<
    "waiting" | "scanning" | "success" | "expired"
  >("waiting");
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时

  // 生成二维码URL（这里使用示例URL，实际项目中应该从后端获取）
  useEffect(() => {
    if (tab === "qrcode") {
      generateQrCode();
    }
  }, [tab]);

  // 生成二维码
  const generateQrCode = async () => {
    setQrCodeLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const token = `login-token-${Date.now()}`;
      const sessionId = getSessionId();
      setQrCodeValue(`${BASE_QR_URL}?token=${token}&sessionId=${sessionId}`);
      setQrCodeStatus("waiting");
      setCountdown(300);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setQrCodeLoading(false);
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

    if (qrCodeStatus === "success") {
      message.success("登录成功！");
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } else if (qrCodeStatus === "scanning") {
      setQrCodeStatus("scanning");
      message.info("检测到扫码，请在手机上确认登录");
    }
  };

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0 && qrCodeStatus === "waiting" && tab === "qrcode") {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setQrCodeStatus("expired");
    }
  }, [countdown, qrCodeStatus, tab]);

  // 定期检查登录状态
  useEffect(() => {
    if (qrCodeStatus === "waiting" && qrCodeValue && tab === "qrcode") {
      const interval = setInterval(checkLoginStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [qrCodeStatus, qrCodeValue, tab]);

  // 验证密码强度
  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const conditions = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
    const metConditions = conditions.filter(Boolean).length;

    if (password.length < 8 || password.length > 20) {
      return "密码长度必须在8-20位之间";
    }

    if (metConditions < 3) {
      return "密码必须包含大小写字母、数字、特殊符号中的至少三种";
    }

    return null;
  };

  // 验证用户名格式
  const validateUsername = (username: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!emailRegex.test(username) && !phoneRegex.test(username)) {
      return "请输入有效的邮箱地址或手机号码";
    }

    return null;
  };

  // 处理登录
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);

    try {
      // 验证用户名
      const usernameError = validateUsername(values.username);
      if (usernameError) {
        message.error(usernameError);
        return;
      }

      // 验证密码
      const passwordError = validatePassword(values.password);
      if (passwordError) {
        message.error(passwordError);
        return;
      }

      // 模拟登录请求
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success("登录成功！");
      navigate("/home");
    } catch (error) {
      message.error("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (qrCodeStatus) {
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
    switch (qrCodeStatus) {
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
    <div className="login-pc-layout">
      <div className="login-pc-left">
        <div className="login-pc-brand">
          <img
            src={require("@/assets/flower.png")}
            alt="logo"
            className="login-logo"
          />
          <Title level={2} className="login-pc-welcome">
            欢迎使用本系统
          </Title>
          <Text className="login-pc-desc">高效 · 安全 · 智能</Text>
        </div>
        {tab === "qrcode" ? (
          <div className="login-pc-qrcode-large">
            {qrCodeLoading ? (
              <Spin size="large" />
            ) : (
              <QRCodeSVG
                value={qrCodeValue}
                size={220}
                level="H"
                className="login-pc-qrcode-img"
              />
            )}
            <div className="login-pc-qrcode-tip">请使用手机扫码登录</div>
          </div>
        ) : (
          <div className="login-pc-illustration">
            <QrcodeOutlined style={{ fontSize: 80, color: "#b3b3b3" }} />
          </div>
        )}
      </div>
      <div className="login-pc-right">
        <div className="login-pc-card">
          <Tabs
            activeKey={tab}
            onChange={(key) => setTab(key as "password" | "qrcode")}
            centered
            size="large"
            className="login-pc-tabs"
          >
            <TabPane tab="账号登录" key="password" />
            <TabPane tab="扫码登录" key="qrcode" />
          </Tabs>
          <div className="login-pc-content">
            {tab === "password" && (
              <Form
                form={form}
                name="login"
                onFinish={handleLogin}
                autoComplete="off"
                size="large"
                className="login-pc-form"
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: "请输入用户名" },
                    {
                      validator: (_, value) => {
                        if (value) {
                          const error = validateUsername(value);
                          if (error) {
                            return Promise.reject(new Error(error));
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="请输入邮箱或手机号"
                    className="login-input"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "请输入密码" },
                    {
                      validator: (_, value) => {
                        if (value) {
                          const error = validatePassword(value);
                          if (error) {
                            return Promise.reject(new Error(error));
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    className="login-input"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>
                <PasswordStrength
                  password={form.getFieldValue("password") || ""}
                />
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="login-button"
                    block
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            )}
            {tab === "qrcode" && (
              <div className="login-pc-qrcode-box">
                {qrCodeLoading ? (
                  <Spin size="large" />
                ) : qrCodeStatus === "expired" ? (
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
                    <QRCodeSVG
                      value={qrCodeValue}
                      size={180}
                      level="H"
                      className="login-pc-qrcode-img"
                    />
                    <div className="qrcode-info">
                      <Text
                        className="status-text"
                        style={{ color: getStatusColor() }}
                      >
                        {getStatusText()}
                      </Text>
                      {qrCodeStatus === "waiting" && (
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
                          disabled={qrCodeLoading}
                        >
                          刷新二维码
                        </Button>
                      </Space>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
