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
import "./style.less";

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "qrcode">("password");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeStatus, setQrCodeStatus] = useState<
    "waiting" | "scanning" | "success" | "expired"
  >("waiting");
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时

  // 生成二维码URL（这里使用示例URL，实际项目中应该从后端获取）
  useEffect(() => {
    if (loginMode === "qrcode") {
      generateQrCode();
    }
  }, [loginMode]);

  // 生成二维码
  const generateQrCode = async () => {
    setQrCodeLoading(true);
    try {
      // 模拟生成二维码的API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const token = `login-token-${Date.now()}`;
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${token}`
      );
      setQrCodeStatus("waiting");
      setCountdown(300);
    } catch (error) {
      message.error("生成二维码失败，请重试");
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

    if (randomStatus === "success") {
      message.success("登录成功！");
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } else if (randomStatus === "scanning") {
      setQrCodeStatus("scanning");
      message.info("检测到扫码，请在手机上确认登录");
    }
  };

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0 && qrCodeStatus === "waiting" && loginMode === "qrcode") {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setQrCodeStatus("expired");
    }
  }, [countdown, qrCodeStatus, loginMode]);

  // 定期检查登录状态
  useEffect(() => {
    if (qrCodeStatus === "waiting" && qrCodeUrl && loginMode === "qrcode") {
      const interval = setInterval(checkLoginStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [qrCodeStatus, qrCodeUrl, loginMode]);

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

  // 切换登录模式
  const switchToQrCode = () => {
    setLoginMode("qrcode");
  };

  const switchToPassword = () => {
    setLoginMode("password");
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
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card" bordered={false}>
            {/* 右上角二维码 */}
            {loginMode === "password" && (
              <div className="qr-code-corner">
                <Tooltip title="点击切换到扫码登录" placement="left">
                  <div className="qr-code-triangle" onClick={switchToQrCode}>
                    <QrcodeOutlined />
                  </div>
                </Tooltip>
              </div>
            )}

            <div className="login-card-inner">
              <div className="login-title-box">
                <Title level={3} className="login-title">
                  账号登录
                </Title>
                <Text className="login-desc">
                  欢迎使用本系统，请输入您的账号信息
                </Text>
              </div>
              <div
                className={`login-content-wrapper ${loginMode === "qrcode" ? "qrcode-mode" : "password-mode"}`}
              >
                {/* 密码登录界面 */}
                <div
                  className={`password-login ${loginMode === "password" ? "active" : "inactive"}`}
                >
                  <Form
                    form={form}
                    name="login"
                    onFinish={handleLogin}
                    autoComplete="off"
                    size="large"
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
                </div>

                {/* 扫码登录界面 */}
                <div
                  className={`qrcode-login ${loginMode === "qrcode" ? "active" : "inactive"}`}
                >
                  <div className="qrcode-header">
                    <Button
                      type="text"
                      icon={<ArrowLeftOutlined />}
                      onClick={switchToPassword}
                      className="back-button"
                    >
                      返回密码登录
                    </Button>
                  </div>

                  <div className="qrcode-content">
                    {qrCodeLoading ? (
                      <div className="qrcode-loading">
                        <Spin size="large" />
                        <Text>正在生成二维码...</Text>
                      </div>
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
                        <div className="qrcode-wrapper">
                          <img
                            src={qrCodeUrl}
                            alt="登录二维码"
                            className="qrcode-image"
                          />
                          {qrCodeStatus === "scanning" && (
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

                  <div className="qrcode-tips">
                    <Title level={5}>使用说明</Title>
                    <ul>
                      <li>打开手机上的应用</li>
                      <li>点击"扫一扫"功能</li>
                      <li>扫描页面上的二维码</li>
                      <li>在手机上确认登录</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
