import React from "react";
import { Progress } from "antd";
import "./PasswordStrength.less";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  level: "weak" | "medium" | "strong" | "very-strong";
  color: string;
  text: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (password: string): StrengthResult => {
    if (!password) {
      return { score: 0, level: "weak", color: "#ff4d4f", text: "请输入密码" };
    }

    let score = 0;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    const hasMaxLength = password.length <= 20;

    // 基础分数
    if (hasMinLength && hasMaxLength) score += 20;
    if (hasUpperCase) score += 20;
    if (hasLowerCase) score += 20;
    if (hasNumbers) score += 20;
    if (hasSpecialChar) score += 20;

    // 长度奖励
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 复杂度奖励
    const conditions = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
    const metConditions = conditions.filter(Boolean).length;
    if (metConditions >= 3) score += 10;
    if (metConditions === 4) score += 10;

    // 确定强度等级
    let level: "weak" | "medium" | "strong" | "very-strong";
    let color: string;
    let text: string;

    if (score < 40) {
      level = "weak";
      color = "#ff4d4f";
      text = "弱";
    } else if (score < 60) {
      level = "medium";
      color = "#faad14";
      text = "中等";
    } else if (score < 80) {
      level = "strong";
      color = "#52c41a";
      text = "强";
    } else {
      level = "very-strong";
      color = "#1890ff";
      text = "很强";
    }

    return { score, level, color, text };
  };

  const strength = calculateStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="password-strength">
      <div className="strength-header">
        <span className="strength-label">密码强度：</span>
        <span className="strength-text" style={{ color: strength.color }}>
          {strength.text}
        </span>
      </div>
      <Progress
        percent={strength.score}
        strokeColor={strength.color}
        showInfo={false}
        size="small"
        className="strength-progress"
      />
      <div className="strength-requirements">
        <div
          className={`requirement ${password.length >= 8 && password.length <= 20 ? "met" : "unmet"}`}
        >
          ✓ 长度8-20位
        </div>
        <div
          className={`requirement ${/[A-Z]/.test(password) ? "met" : "unmet"}`}
        >
          ✓ 包含大写字母
        </div>
        <div
          className={`requirement ${/[a-z]/.test(password) ? "met" : "unmet"}`}
        >
          ✓ 包含小写字母
        </div>
        <div className={`requirement ${/\d/.test(password) ? "met" : "unmet"}`}>
          ✓ 包含数字
        </div>
        <div
          className={`requirement ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "met" : "unmet"}`}
        >
          ✓ 包含特殊符号
        </div>
      </div>
    </div>
  );
};

export default PasswordStrength;
