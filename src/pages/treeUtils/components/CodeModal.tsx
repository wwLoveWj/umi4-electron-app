/**
 * @file 代码片段添加/编辑弹窗组件
 * @description 用于添加或编辑代码片段，包含标题、代码编辑器和语言选择
 */
import React from "react";
import { Modal, Form, Input, Select } from "antd";
import CodeEditor from "./CodeEditor";

const { Option } = Select;
const { TextArea } = Input;
/**
 * CodeModal 组件 props
 * @typedef {Object} CodeModalProps
 * @property {boolean} visible - 弹窗是否可见
 * @property {string} type - 弹窗类型：'add' | 'edit'
 * @property {string} title - 当前编辑的标题
 * @property {string} code - 当前编辑的代码
 * @property {string} language - 当前编辑的语言
 * @property {string} [parentKey] - 父节点 key（添加时使用）
 * @property {() => void} onCancel - 取消回调
 * @property {(values: any) => void} onOk - 确认回调
 */
interface CodeModalProps {
  visible: boolean;
  type: "add" | "edit";
  title: string;
  code: string;
  language: string;
  parentKey?: string;
  onCancel: () => void;
  onOk: (values: any) => void;
}

/**
 * 代码片段添加/编辑弹窗
 * @param {CodeModalProps} props
 */
const CodeModal: React.FC<CodeModalProps> = ({
  visible,
  type,
  title,
  code,
  language,
  parentKey,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();

  // 初始化表单数据
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        title,
        code,
        language,
        parentKey,
      });
    }
  }, [visible, title, code, language, parentKey]);

  /**
   * 处理表单提交
   */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  return (
    <Modal
      title={type === "add" ? "添加代码片段" : "编辑代码片段"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: "请输入标题" }]}
        >
          <Input placeholder="请输入标题" />
        </Form.Item>
        <Form.Item
          name="code"
          label="代码"
          rules={[{ required: true, message: "请输入代码" }]}
        >
          <CodeEditor
            value={form.getFieldValue("code") || ""}
            language={form.getFieldValue("language") || "javascript"}
            onChange={(value) => form.setFieldValue("code", value)}
          />
          {/* <TextArea
            value={form.getFieldValue("code") || ""}
            onChange={(value) => form.setFieldValue("code", value)}
          ></TextArea> */}
        </Form.Item>
        <Form.Item
          name="language"
          label="语言"
          rules={[{ required: true, message: "请选择语言" }]}
        >
          <Select>
            <Option value="javascript">JavaScript</Option>
            <Option value="typescript">TypeScript</Option>
            <Option value="html">HTML</Option>
            <Option value="css">CSS</Option>
            <Option value="json">JSON</Option>
            <Option value="yaml">YAML</Option>
            <Option value="markdown">Markdown</Option>
            <Option value="plaintext">Plain Text</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CodeModal;
