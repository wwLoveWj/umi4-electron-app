import React from "react";
import { Select, Button, Divider, Tag } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { ApprovalFlow } from "./types";

interface FlowSelectorProps {
  flows: ApprovalFlow[];
  currentFlow: ApprovalFlow | null;
  onFlowChange: (flow: ApprovalFlow) => void;
  onCreateFlow: () => void;
  onEditFlow: (flow: ApprovalFlow) => void;
}

/**
 * 流程选择器组件
 */
const FlowSelector: React.FC<FlowSelectorProps> = ({
  flows,
  currentFlow,
  onFlowChange,
  onCreateFlow,
  onEditFlow,
}) => {
  return (
    <Select
      style={{ width: 200 }}
      placeholder="请选择流程"
      value={currentFlow?.id}
      onChange={(value) => {
        const selectedFlow = flows.find((flow) => flow.id === value);
        if (selectedFlow) {
          onFlowChange(selectedFlow);
        }
      }}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ padding: "8px", textAlign: "center" }}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onCreateFlow();
              }}
              style={{ width: "100%" }}
            >
              新建流程
            </Button>
          </div>
        </div>
      )}
    >
      {flows.map((flow) => (
        <Select.Option key={flow.id} value={flow.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{flow.name}</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "12px", color: "#666" }}>
                {flow.nodes.length}个节点
              </span>
              {flow.isActive && <Tag color="green">启用</Tag>}
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFlow(flow);
                }}
                style={{ padding: 0, height: "auto" }}
              />
            </div>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default FlowSelector;
