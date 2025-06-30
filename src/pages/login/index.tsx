import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Tabs, Card, Space, Tooltip } from "antd";
import {
  UserOutlined,
  LockOutlined,
  QrcodeOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useNavigate } from "umi";
import PasswordStrength from "./components/PasswordStrength";
import "./style.less";

const { TabPane } = Tabs;

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // 生成二维码URL（这里使用示例URL，实际项目中应该从后端获取）
  useEffect(() => {
    setQrCodeUrl(
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=login-token-123456"
    );
  }, []);

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

  // 处理扫码登录
  const handleQrCodeLogin = () => {
    navigate("/login/qrcode");
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <div className="login-header">
            <h1>欢迎登录</h1>
            <p>请输入您的账号信息</p>
          </div>

          <Card className="login-card" bordered={false}>
            <Tabs defaultActiveKey="password" centered>
              <TabPane tab="密码登录" key="password">
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
              </TabPane>

              <TabPane tab="扫码登录" key="qrcode">
                <div className="qrcode-container">
                  <div className="qrcode-placeholder">
                    <QrcodeOutlined className="qrcode-icon" />
                    <p>请使用手机扫描二维码登录</p>
                    <Button type="primary" onClick={handleQrCodeLogin}>
                      生成二维码
                    </Button>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>

          {/* 右上角二维码 */}
          <div className="qr-code-corner">
            <Tooltip
              title={
                <div className="qr-code-tooltip">
                  <img src={qrCodeUrl} alt="扫码登录" />
                  <p>扫码登录</p>
                </div>
              }
              placement="left"
              trigger="hover"
            >
              <div className="qr-code-triangle" onClick={handleQrCodeLogin}>
                <QrcodeOutlined />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
