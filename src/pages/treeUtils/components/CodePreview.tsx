/**
 * @file 代码预览组件
 * @description 用于显示代码高亮预览和操作按钮（复制、分享、格式化、语言切换）
 */
import React from "react";
import { Card, Button, Select, Space, Typography } from "antd";
import {
  CopyOutlined,
  ShareAltOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../style.less";
const { Text } = Typography;
const { Option } = Select;

/**
 * CodePreview 组件 props
 * @typedef {Object} CodePreviewProps
 * @property {string} title - 代码片段标题
 * @property {string} code - 代码内容
 * @property {string} language - 代码语言
 * @property {boolean} isSelected - 是否选中节点
 * @property {() => void} onCopy - 复制回调
 * @property {() => void} onShare - 分享回调
 * @property {() => void} onFormat - 格式化回调
 * @property {(language: string) => void} onLanguageChange - 语言切换回调
 */
interface CodePreviewProps {
  title: string;
  code: string;
  language: string;
  isSelected: boolean;
  onCopy: () => void;
  onShare: () => void;
  onFormat: () => void;
  onLanguageChange: (language: string) => void;
}

/**
 * 代码预览组件
 * @param {CodePreviewProps} props
 */
const CodePreview: React.FC<CodePreviewProps> = ({
  title,
  code,
  language,
  isSelected,
  onCopy,
  onShare,
  onFormat,
  onLanguageChange,
}) => {
  return (
    <Card
      title={<div className="card-title-preview">{title || "代码预览"}</div>}
      style={{ flex: 1 }}
      extra={
        isSelected &&
        code && (
          <Space>
            <Select
              value={language}
              onChange={onLanguageChange}
              style={{ width: 120 }}
            >
              <Option value="text">Text</Option>
              <Option value="javascript">JavaScript</Option>
              <Option value="css">CSS</Option>
              <Option value="html">HTML</Option>
              <Option value="json">JSON</Option>
              <Option value="yaml">YAML</Option>
            </Select>
            <Button
              icon={<FormatPainterOutlined />}
              onClick={onFormat}
              title="格式化代码"
            />
            <Button type="primary" icon={<CopyOutlined />} onClick={onCopy}>
              复制代码
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={onShare}>
              分享
            </Button>
          </Space>
        )
      }
    >
      {isSelected && code ? (
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            background: "#1e1e1e",
            padding: "16px",
            borderRadius: "4px",
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          {code}
        </SyntaxHighlighter>
      ) : isSelected ? (
        <Text type="secondary">该节点没有代码内容</Text>
      ) : (
        <Text type="secondary">请从左侧选择要查看的代码</Text>
      )}
    </Card>
  );
};

export default CodePreview;
