/**
 * @file 代码编辑器组件
 * @description 封装代码编辑器的功能
 */
import React from "react";
import { Input } from "antd";

const { TextArea } = Input;

/**
 * CodeEditor 组件 props
 * @typedef {Object} CodeEditorProps
 * @property {string} value - 编辑器内容
 * @property {string} language - 代码语言
 * @property {(value: string) => void} onChange - 内容变化回调
 */
interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

/**
 * 代码编辑器组件
 * @param {CodeEditorProps} props
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
}) => {
  return (
    <div style={{ height: "300px" }}>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: "100%",
          fontFamily: "Consolas, Monaco, 'Courier New', monospace",
          fontSize: 14,
          lineHeight: 1.5,
        }}
        placeholder={`请输入 ${language} 代码...`}
      />
    </div>
  );
};

export default CodeEditor;
