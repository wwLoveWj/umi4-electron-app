/**
 * @file 知识库新增/编辑弹窗
 */
import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Card,
  Tag,
  Space,
  Button,
  Tooltip,
  message,
} from "antd";
import { InfoCircleOutlined, SettingOutlined } from "@ant-design/icons";
import type { KnowledgeItem } from "@/services/knowledgeDB";
import {
  ApprovalFlow,
  ApprovalNodeType,
} from "@/pages/setting/components/approvalFlow/components/types";

const { TextArea } = Input;
const { Option } = Select;

interface KnowledgeModalProps {
  visible: boolean;
  item: KnowledgeItem | null;
  onCancel: () => void;
  onOk: (item: KnowledgeItem) => void;
  allCategories: string[];
  allTags: string[];
}

/**
 * 获取可用的审批流列表
 * @returns {ApprovalFlow[]} 激活的审批流列表
 */
function getAvailableFlows(): ApprovalFlow[] {
  try {
    const flowsStr = localStorage.getItem("approvalFlows");
    if (flowsStr) {
      const flows: ApprovalFlow[] = JSON.parse(flowsStr);
      return flows.filter((flow) => flow.isActive !== false);
    }
  } catch (error) {
    console.error("获取审批流失败:", error);
  }
  return [];
}

/**
 * 获取默认审批流配置
 * @returns {{ flowId?: string, currentNodeId?: string }}
 */
function getDefaultKnowledgeFlow() {
  const flows = getAvailableFlows();
  // 优先找知识库默认流程
  const defaultFlow = flows.find(
    (f: any) =>
      f.isKnowledgeBaseDefault &&
      f.isActive &&
      f.nodes.some((n: any) => n.type === "start")
  );
  if (defaultFlow) {
    const startNode = defaultFlow.nodes.find((n: any) => n.type === "start");
    if (startNode) {
      return { flowId: defaultFlow.id, currentNodeId: startNode.id };
    }
  }
  // 其次找激活的第一个
  const activeFlow = flows.find(
    (f) => f.isActive && f.nodes.some((n) => n.type === "start")
  );
  if (activeFlow) {
    const startNode = activeFlow.nodes.find((n) => n.type === "start");
    if (startNode) {
      return { flowId: activeFlow.id, currentNodeId: startNode.id };
    }
  }
  return { flowId: undefined, currentNodeId: undefined };
}

/**
 * 审批流选择器组件
 */
const FlowSelector: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null);

  useEffect(() => {
    const availableFlows = getAvailableFlows();
    setFlows(availableFlows);

    // 设置当前选中的审批流
    if (value) {
      const flow = availableFlows.find((f) => f.id === value);
      setSelectedFlow(flow || null);
    }
  }, [value]);

  const handleFlowSelect = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    setSelectedFlow(flow || null);
    onChange?.(flowId);
  };

  const handleNoFlow = () => {
    setSelectedFlow(null);
    onChange?.("");
  };

  /**
   * 创建默认审批流
   */
  const createDefaultFlow = () => {
    const defaultFlow: ApprovalFlow = {
      id: `flow_${Date.now()}`,
      name: "默认知识库审批流",
      description: "适用于一般知识库条目的标准审批流程",
      isActive: true,
      nodes: [
        {
          id: "start_1",
          name: "提交审核",
          type: ApprovalNodeType.START,
          approvers: [],
          requiredApprovers: [],
          isRequired: false,
          position: { x: 100, y: 100 },
          description: "知识条目提交审核",
        },
        {
          id: "review_1",
          name: "内容审核",
          type: ApprovalNodeType.APPROVER,
          approvers: ["审核员1", "审核员2"],
          requiredApprovers: ["审核员1"],
          isRequired: true,
          position: { x: 300, y: 100 },
          description: "审核知识条目的内容和质量",
        },
        {
          id: "review_2",
          name: "技术审核",
          type: ApprovalNodeType.APPROVER,
          approvers: ["技术专家"],
          requiredApprovers: ["技术专家"],
          isRequired: true,
          position: { x: 500, y: 100 },
          description: "技术专家审核技术准确性",
        },
        {
          id: "end_1",
          name: "审批完成",
          type: ApprovalNodeType.END,
          approvers: [],
          requiredApprovers: [],
          isRequired: false,
          position: { x: 700, y: 100 },
          description: "审批流程完成",
        },
      ],
      edges: [
        {
          id: "edge_1",
          source: "start_1",
          target: "review_1",
        },
        {
          id: "edge_2",
          source: "review_1",
          target: "review_2",
        },
        {
          id: "edge_3",
          source: "review_2",
          target: "end_1",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 获取现有审批流
      const existingFlowsStr = localStorage.getItem("approvalFlows");
      const existingFlows: ApprovalFlow[] = existingFlowsStr
        ? JSON.parse(existingFlowsStr)
        : [];

      // 添加默认审批流
      const updatedFlows = [...existingFlows, defaultFlow];
      localStorage.setItem("approvalFlows", JSON.stringify(updatedFlows));

      // 更新组件状态
      setFlows([defaultFlow]);
      setSelectedFlow(defaultFlow);
      onChange?.(defaultFlow.id);

      // 显示成功消息
      message.success("默认审批流创建成功！");
    } catch (error) {
      console.error("创建默认审批流失败:", error);
      message.error("创建默认审批流失败");
    }
  };

  if (flows.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "#fafafa",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
        }}
      >
        <div style={{ color: "#999", marginBottom: 12, fontSize: 14 }}>
          暂无可用的审批流
        </div>
        <div style={{ fontSize: 12, color: "#ccc", marginBottom: 16 }}>
          请先配置审批流以启用流程化审批
        </div>
        <Space>
          <Button type="primary" size="small" onClick={createDefaultFlow}>
            创建默认审批流
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              // 这里可以跳转到审批流配置页面
              console.log("跳转到审批流配置");
            }}
          >
            手动配置
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div>
      {/* 审批流选择 */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 500 }}>选择审批流：</span>
          <Button
            size="small"
            type="link"
            icon={<SettingOutlined />}
            onClick={() => {
              // 这里可以跳转到审批流配置页面
              console.log("跳转到审批流配置");
            }}
          >
            配置审批流
          </Button>
        </div>

        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 不使用审批流选项 */}
          <Card
            size="small"
            style={{
              cursor: "pointer",
              border: !value ? "2px solid #1890ff" : "1px solid #d9d9d9",
              background: !value ? "#e6f4ff" : "#fff",
            }}
            onClick={handleNoFlow}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: !value ? "#1890ff" : "#262626",
                  }}
                >
                  不使用审批流
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  直接提交，无需审批流程
                </div>
              </div>
              {!value && <Tag color="blue">已选择</Tag>}
            </div>
          </Card>

          {/* 审批流选项 */}
          {flows.map((flow) => {
            const isSelected = value === flow.id;
            const nodeCount = flow.nodes.filter((n) => n.type !== "end").length;

            return (
              <Card
                key={flow.id}
                size="small"
                style={{
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                  background: isSelected ? "#e6f4ff" : "#fff",
                }}
                onClick={() => handleFlowSelect(flow.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: isSelected ? "#1890ff" : "#262626",
                        }}
                      >
                        {flow.name}
                      </span>
                      <Tag color="green" style={{ fontSize: 11 }}>
                        激活
                      </Tag>
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#666", marginBottom: 6 }}
                    >
                      节点数: {nodeCount} | 描述: {flow.description || "无"}
                    </div>
                    {/* 流程预览 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "#999",
                        flexWrap: "wrap",
                      }}
                    >
                      {flow.nodes
                        .filter((n) => n.type !== "end")
                        .slice(0, 4)
                        .map((node, idx) => (
                          <span key={node.id}>
                            {node.name}
                            {idx <
                              Math.min(
                                4,
                                flow.nodes.filter((n) => n.type !== "end")
                                  .length - 1
                              ) && <span style={{ margin: "0 2px" }}>→</span>}
                          </span>
                        ))}
                      {flow.nodes.filter((n) => n.type !== "end").length >
                        4 && <span style={{ color: "#ccc" }}>...</span>}
                    </div>
                  </div>
                  {isSelected && <Tag color="blue">已选择</Tag>}
                </div>
              </Card>
            );
          })}
        </Space>
      </div>

      {/* 选中审批流的详细信息 */}
      {selectedFlow && (
        <Card
          size="small"
          title={
            <span>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              审批流详情
            </span>
          }
          style={{ background: "#f8f9fa" }}
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>流程名称：</strong>
              {selectedFlow.name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>流程描述：</strong>
              {selectedFlow.description || "无"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>节点数量：</strong>
              {selectedFlow.nodes.filter((n) => n.type !== "end").length}
            </div>
            <div>
              <strong>完整流程：</strong>
              <div
                style={{
                  marginTop: 4,
                  padding: "8px 12px",
                  background: "#fff",
                  borderRadius: 4,
                  border: "1px solid #e8e8e8",
                }}
              >
                {selectedFlow.nodes
                  .filter((n) => n.type !== "end")
                  .map((node, idx) => (
                    <span key={node.id}>
                      <span
                        style={{
                          color: node.type === "start" ? "#52c41a" : "#1890ff",
                          fontWeight: node.type === "start" ? 600 : 500,
                        }}
                      >
                        {node.name}
                      </span>
                      {idx <
                        selectedFlow.nodes.filter((n) => n.type !== "end")
                          .length -
                          1 && (
                        <span style={{ margin: "0 4px", color: "#ccc" }}>
                          →
                        </span>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  visible,
  item,
  onCancel,
  onOk,
  allCategories,
  allTags,
}) => {
  const [form] = Form.useForm();
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");

  useEffect(() => {
    if (visible) {
      if (!item) {
        // 新增时，自动用最新默认流程
        const { flowId } = getDefaultKnowledgeFlow();
        form.setFieldsValue({
          question: "",
          answer: "",
          category: "",
          tags: [],
          flowId: flowId || "",
        });
        setSelectedFlowId(flowId || "");
      } else {
        // 编辑时
        form.setFieldsValue(item);
        setSelectedFlowId(item.flowId || "");
      }
    }
  }, [visible]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const now = new Date().toISOString();

    let extraFlow = {};
    if (!item) {
      // 新增时根据选择的审批流初始化
      if (selectedFlowId) {
        const flows = getAvailableFlows();
        const selectedFlow = flows.find((f) => f.id === selectedFlowId);
        if (selectedFlow) {
          const startNode = selectedFlow.nodes.find((n) => n.type === "start");
          if (startNode) {
            extraFlow = {
              flowId: selectedFlowId,
              currentNodeId: startNode.id,
              nodeHistory: [],
            };
          }
        }
      } else {
        // 不使用审批流
        extraFlow = { flowId: undefined, currentNodeId: undefined };
      }
    } else {
      // 编辑时保持原有审批流或更新
      if (selectedFlowId !== item.flowId) {
        if (selectedFlowId) {
          const flows = getAvailableFlows();
          const selectedFlow = flows.find((f) => f.id === selectedFlowId);
          if (selectedFlow) {
            const startNode = selectedFlow.nodes.find(
              (n) => n.type === "start"
            );
            if (startNode) {
              extraFlow = {
                flowId: selectedFlowId,
                currentNodeId: startNode.id,
                nodeHistory: [],
              };
            }
          }
        } else {
          extraFlow = { flowId: undefined, currentNodeId: undefined };
        }
      }
    }

    onOk({
      ...item,
      ...values,
      id:
        item?.id ||
        `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: item?.createdAt || now,
      updatedAt: now,
      ...extraFlow,
    });
  };

  return (
    <Modal
      open={visible}
      title={item ? "编辑知识条目" : "新增知识条目"}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnHidden
      maskClosable={false}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="问题"
          name="question"
          rules={[{ required: true, message: "请输入问题" }]}
        >
          <Input maxLength={100} placeholder="请输入问题" />
        </Form.Item>
        <Form.Item
          label="答案"
          name="answer"
          rules={[{ required: true, message: "请输入答案" }]}
        >
          <TextArea rows={4} maxLength={1000} placeholder="请输入答案" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Select
            showSearch
            allowClear
            placeholder="请选择或输入分类"
            optionFilterProp="children"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: 8 }}>
                  <Input
                    style={{ width: "100%" }}
                    placeholder="自定义分类，回车添加"
                    onPressEnter={(e) => {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !allCategories.includes(value)) {
                        form.setFieldsValue({ category: value });
                      }
                    }}
                  />
                </div>
              </>
            )}
          >
            {allCategories.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="标签" name="tags">
          <Select
            mode="tags"
            placeholder="请输入标签，回车分隔"
            style={{ width: "100%" }}
          >
            {allTags.map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="文档引用" name="documentUrl">
          <Input placeholder="请输入文档URL地址（可选）" maxLength={500} />
        </Form.Item>

        {/* 审批流选择 */}
        <Form.Item
          label={
            <span>
              审批流程
              <Tooltip title="选择用于此知识条目的审批流程，如果不选择则直接提交无需审批">
                <InfoCircleOutlined style={{ marginLeft: 8, color: "#999" }} />
              </Tooltip>
            </span>
          }
        >
          <FlowSelector value={selectedFlowId} onChange={setSelectedFlowId} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default KnowledgeModal;
