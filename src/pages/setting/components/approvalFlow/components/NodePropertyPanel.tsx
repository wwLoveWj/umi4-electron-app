import React, { useEffect, useState } from "react";
import { Form, Input, Switch, Select } from "antd";
import { ApprovalNode, ApprovalNodeType, ApprovalModule } from "./types";

const { TextArea } = Input;
const { Option } = Select;

const LOCAL_KEY = "customNodeTypes";
const PRESET_NODES = [
  { type: "start", name: "发起人", icon: "🚀" },
  { type: "approver", name: "审批人", icon: "👤" },
  { type: "condition", name: "条件分支", icon: "🔀" },
  { type: "parallel", name: "并行审批", icon: "⚡" },
  { type: "auto", name: "自动审批", icon: "🤖" },
  { type: "email", name: "邮件催办", icon: "📧" },
  { type: "end", name: "结束节点", icon: "🏁" },
];

function getNodeTypeConfig(type: string) {
  const saved = localStorage.getItem(LOCAL_KEY);
  const custom = saved ? JSON.parse(saved) : [];
  const preset = PRESET_NODES.find((p) => p.type === type);
  const local = custom.find((d: any) => d.type === type);
  return local ? { ...preset, ...local } : preset;
}

interface NodePropertyPanelProps {
  node: ApprovalNode | null;
  onChange: (node: ApprovalNode) => void;
  onClose?: () => void;
}

/**
 * 右侧属性面板组件
 */
const NodePropertyPanel: React.FC<NodePropertyPanelProps> = ({
  node,
  onChange,
  onClose,
}) => {
  const [formData, setFormData] = useState<ApprovalNode | null>(node);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setFormData(node);
    setVisible(!!node);
  }, [node]);

  if (!formData) {
    return (
      <div style={{ padding: 24, color: "#999" }}>
        请选择画布中的节点进行编辑
      </div>
    );
  }

  const nodeTypeConfig = getNodeTypeConfig(formData.type);
  const customFields = nodeTypeConfig?.fields || [];

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      onChange(updated);
      return updated;
    });
  };

  // 失焦或回车时才提交
  const handleBlurOrEnter = () => {
    if (formData) onChange(formData);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  return (
    <div
      className={`node-property-panel${visible ? " node-property-panel-show" : " node-property-panel-hide"}`}
      style={{
        padding: 24,
        minWidth: 280,
        background: "#fafbfc",
        height: "100%",
        borderLeft: "1px solid #e5e6eb",
        position: "relative",
        transition: "opacity 0.3s, transform 0.3s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(40px)",
      }}
    >
      <span
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          fontSize: 18,
          color: "#999",
          cursor: "pointer",
          zIndex: 10,
          transition: "color 0.2s",
        }}
        onClick={handleClose}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4d4f")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
        title="关闭属性面板"
      >
        ×
      </span>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
        节点属性
      </div>
      <Form layout="vertical">
        <Form.Item label="节点名称">
          <Input
            value={formData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            onBlur={handleBlurOrEnter}
            onPressEnter={handleBlurOrEnter}
          />
        </Form.Item>
        <Form.Item label="节点类型">
          <Input value={formData.type} disabled />
        </Form.Item>
        {/* 动态渲染自定义字段 */}
        {customFields.map((field: any) => (
          <Form.Item key={field.key} label={field.label}>
            {field.type === "number" ? (
              <Input
                type="number"
                value={(formData as Record<string, any>)[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                onBlur={handleBlurOrEnter}
              />
            ) : field.type === "select" ? (
              <Select
                value={(formData as Record<string, any>)[field.key]}
                onChange={(v) => handleFieldChange(field.key, v)}
                onBlur={handleBlurOrEnter}
              >
                {(field.options
                  ? String(field.options).split(",")
                  : ["A", "B", "C"]
                ).map((opt: string) => (
                  <Option key={opt.trim()} value={opt.trim()}>
                    {opt.trim()}
                  </Option>
                ))}
              </Select>
            ) : field.type === "textarea" ? (
              <TextArea
                value={(formData as Record<string, any>)[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                onBlur={handleBlurOrEnter}
                rows={3}
              />
            ) : (
              <Input
                value={(formData as Record<string, any>)[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                onBlur={handleBlurOrEnter}
              />
            )}
          </Form.Item>
        ))}
        {(formData.type === ApprovalNodeType.APPROVER ||
          formData.type === ApprovalNodeType.PARALLEL) && (
          <>
            <Form.Item label="审批模块">
              <Select
                value={formData.module}
                onChange={(v) => handleFieldChange("module", v)}
                onBlur={handleBlurOrEnter}
              >
                <Option value={ApprovalModule.KNOWLEDGE_BASE}>知识库</Option>
                <Option value={ApprovalModule.DOCUMENT}>文档</Option>
                <Option value={ApprovalModule.PROJECT}>项目</Option>
                <Option value={ApprovalModule.EXPENSE}>费用</Option>
                <Option value={ApprovalModule.LEAVE}>请假</Option>
                <Option value={ApprovalModule.PURCHASE}>采购</Option>
              </Select>
            </Form.Item>
            <Form.Item label="是否必须审批">
              <Switch
                checked={formData.isRequired}
                onChange={(v) => {
                  setFormData({ ...formData, isRequired: v } as ApprovalNode);
                  if (formData)
                    onChange({ ...formData, isRequired: v } as ApprovalNode);
                }}
              />
            </Form.Item>
            <Form.Item label="审批人">
              <Select
                mode="tags"
                value={formData.approvers}
                onChange={(v) => handleFieldChange("approvers", v)}
                allowClear
                onBlur={handleBlurOrEnter}
              />
            </Form.Item>
            <Form.Item label="必审人">
              <Select
                mode="tags"
                value={formData.requiredApprovers}
                onChange={(v) => handleFieldChange("requiredApprovers", v)}
                allowClear
                onBlur={handleBlurOrEnter}
              />
            </Form.Item>
          </>
        )}
        {formData.type === ApprovalNodeType.CONDITION && (
          <Form.Item label="条件">
            <Select
              mode="tags"
              value={formData.conditions}
              onChange={(v) => handleFieldChange("conditions", v)}
              allowClear
              onBlur={handleBlurOrEnter}
            />
          </Form.Item>
        )}
        {formData.type === ApprovalNodeType.AUTO && (
          <Form.Item label="自动审批结果">
            <Select
              value={formData.autoApprove}
              onChange={(v) => handleFieldChange("autoApprove", v)}
              onBlur={handleBlurOrEnter}
            >
              <Option value={true}>自动通过</Option>
              <Option value={false}>自动拒绝</Option>
            </Select>
          </Form.Item>
        )}
        {formData.type === ApprovalNodeType.EMAIL && (
          <>
            <Form.Item label="邮件收件人">
              <Select
                mode="tags"
                value={formData.emailRecipients}
                onChange={(v) => handleFieldChange("emailRecipients", v)}
                allowClear
                onBlur={handleBlurOrEnter}
              />
            </Form.Item>
            <Form.Item label="邮件主题">
              <Input
                value={formData.emailSubject}
                onChange={(e) =>
                  handleFieldChange("emailSubject", e.target.value)
                }
                onBlur={handleBlurOrEnter}
                onPressEnter={handleBlurOrEnter}
              />
            </Form.Item>
            <Form.Item label="邮件模板">
              <Input.TextArea
                rows={3}
                value={formData.emailTemplate}
                onChange={(e) =>
                  handleFieldChange("emailTemplate", e.target.value)
                }
                onBlur={handleBlurOrEnter}
              />
            </Form.Item>
          </>
        )}
        <Form.Item label="节点描述">
          <Input.TextArea
            rows={2}
            value={formData.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            onBlur={handleBlurOrEnter}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default NodePropertyPanel;
