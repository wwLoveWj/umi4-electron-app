import React from "react";
import { Form, Input, Switch, Select } from "antd";
import { ApprovalNode, ApprovalNodeType, ApprovalModule } from "./types";

const { Option } = Select;

interface NodePropertyPanelProps {
  node: ApprovalNode | null;
  onChange: (node: ApprovalNode) => void;
}

/**
 * 右侧属性面板组件
 */
const NodePropertyPanel: React.FC<NodePropertyPanelProps> = ({
  node,
  onChange,
}) => {
  if (!node) {
    return (
      <div style={{ padding: 24, color: "#999" }}>
        请选择画布中的节点进行编辑
      </div>
    );
  }

  const handleFieldChange = (field: keyof ApprovalNode, value: any) => {
    onChange({ ...node, [field]: value });
  };

  return (
    <div
      style={{
        padding: 24,
        minWidth: 280,
        background: "#fafbfc",
        height: "100%",
        borderLeft: "1px solid #e5e6eb",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
        节点属性
      </div>
      <Form layout="vertical">
        <Form.Item label="节点名称">
          <Input
            value={node.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="节点类型">
          <Input value={node.type} disabled />
        </Form.Item>
        {(node.type === ApprovalNodeType.APPROVER ||
          node.type === ApprovalNodeType.PARALLEL) && (
          <>
            <Form.Item label="审批模块">
              <Select
                value={node.module}
                onChange={(v) => handleFieldChange("module", v)}
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
                checked={node.isRequired}
                onChange={(v) => handleFieldChange("isRequired", v)}
              />
            </Form.Item>
            <Form.Item label="审批人">
              <Select
                mode="tags"
                value={node.approvers}
                onChange={(v) => handleFieldChange("approvers", v)}
                allowClear
              />
            </Form.Item>
            <Form.Item label="必审人">
              <Select
                mode="tags"
                value={node.requiredApprovers}
                onChange={(v) => handleFieldChange("requiredApprovers", v)}
                allowClear
              />
            </Form.Item>
          </>
        )}
        {node.type === ApprovalNodeType.CONDITION && (
          <Form.Item label="条件">
            <Select
              mode="tags"
              value={node.conditions}
              onChange={(v) => handleFieldChange("conditions", v)}
              allowClear
            />
          </Form.Item>
        )}
        {node.type === ApprovalNodeType.AUTO && (
          <Form.Item label="自动审批结果">
            <Select
              value={node.autoApprove}
              onChange={(v) => handleFieldChange("autoApprove", v)}
            >
              <Option value={true}>自动通过</Option>
              <Option value={false}>自动拒绝</Option>
            </Select>
          </Form.Item>
        )}
        {node.type === ApprovalNodeType.EMAIL && (
          <>
            <Form.Item label="邮件收件人">
              <Select
                mode="tags"
                value={node.emailRecipients}
                onChange={(v) => handleFieldChange("emailRecipients", v)}
                allowClear
              />
            </Form.Item>
            <Form.Item label="邮件主题">
              <Input
                value={node.emailSubject}
                onChange={(e) =>
                  handleFieldChange("emailSubject", e.target.value)
                }
              />
            </Form.Item>
            <Form.Item label="邮件模板">
              <Input.TextArea
                rows={3}
                value={node.emailTemplate}
                onChange={(e) =>
                  handleFieldChange("emailTemplate", e.target.value)
                }
              />
            </Form.Item>
          </>
        )}
        <Form.Item label="节点描述">
          <Input.TextArea
            rows={2}
            value={node.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default NodePropertyPanel;
