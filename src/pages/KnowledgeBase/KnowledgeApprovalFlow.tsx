/**
 * @file 知识库审批流配置页面
 * @description 专门用于配置知识库内容的审批流程，支持预设模板和自定义配置
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Typography,
  Row,
  Col,
  Tag,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Node, Edge } from "@antv/x6";

// 导入审批流相关组件
import FlowEditModal from "@/pages/setting/components/approvalFlow/components/FlowEditModal";
import ContextMenu from "@/pages/setting/components/approvalFlow/components/ContextMenu";
import FlowSelector from "@/pages/setting/components/approvalFlow/components/FlowSelector";
import GraphEditor from "@/pages/setting/components/approvalFlow/components/GraphEditor";
import { useFlowStorage } from "@/pages/setting/components/approvalFlow/components/hooks/useFlowStorage";

// 导入类型定义
import {
  ApprovalFlow,
  ApprovalNode,
  ApprovalNodeType,
  ApprovalModule,
} from "@/pages/setting/components/approvalFlow/components/types";

const { Title, Text } = Typography;

/**
 * 知识库审批流配置页面
 */
const KnowledgeApprovalFlow: React.FC = () => {
  // 获取最新flows
  function getLatestFlows() {
    const flowsStr = localStorage.getItem("approvalFlows");
    if (!flowsStr) return [];
    return JSON.parse(flowsStr);
  }

  // 页面刷新key
  const [refreshKey, setRefreshKey] = useState(0);
  // 本地flows状态
  const [localFlows, setLocalFlows] = useState<any[]>(getLatestFlows());

  // 使用流程存储钩子
  const {
    flows,
    currentFlow,
    setCurrentFlow,
    updateCurrentFlow,
    addFlow,
    deleteFlow,
  } = useFlowStorage();

  // flows变化或页面刷新时，同步localFlows
  useEffect(() => {
    setLocalFlows(getLatestFlows());
  }, [flows, refreshKey]);

  // 状态管理
  const [flowEditVisible, setFlowEditVisible] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuX, setContextMenuX] = useState(0);
  const [contextMenuY, setContextMenuY] = useState(0);
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(
    null
  );
  const [nodeEditModalVisible, setNodeEditModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null);

  // 图形引用
  const graphRef = useRef<any>(null);

  // 获取知识库相关的审批流
  const knowledgeFlows = flows.filter(
    (flow) =>
      flow.nodes.some(
        (node) => node.module === ApprovalModule.KNOWLEDGE_BASE
      ) ||
      flow.name.includes("知识库") ||
      flow.description.includes("知识库")
  );

  // 审批流模板列表
  const TEMPLATE_LIST = [
    {
      type: "simple",
      name: "简单审批",
      desc: "适用于一般知识内容的快速审批，流程短、节点少。",
      preview: ["发起人", "部门经理", "结束"],
    },
    {
      type: "standard",
      name: "标准审批",
      desc: "适用于重要知识内容的标准审批流程，包含多级审核。",
      preview: ["发起人", "部门经理", "技术专家", "结束"],
    },
    {
      type: "strict",
      name: "严格审批",
      desc: "适用于高风险或敏感知识内容，流程更严格。",
      preview: ["发起人", "部门经理", "法务", "技术专家", "结束"],
    },
  ];

  /**
   * 创建预设的知识库审批流程模板
   */
  const createKnowledgeFlowTemplate = (
    templateType: "simple" | "standard" | "strict"
  ) => {
    let flow: ApprovalFlow;

    switch (templateType) {
      case "simple":
        // 简单审批：发起人 -> 部门经理 -> 结束
        flow = {
          id: `knowledge_flow_${Date.now()}`,
          name: "知识库简单审批流程",
          description: "适用于一般知识内容的快速审批",
          nodes: [
            {
              id: "start_1",
              name: "发起人",
              type: ApprovalNodeType.START,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 100 },
            },
            {
              id: "approver_1",
              name: "部门经理审批",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["部门经理"],
              requiredApprovers: ["部门经理"],
              isRequired: true,
              position: { x: 100, y: 250 },
            },
            {
              id: "end_1",
              name: "结束",
              type: ApprovalNodeType.END,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 400 },
            },
          ],
          edges: [
            {
              id: "edge_1",
              source: "start_1",
              target: "approver_1",
            },
            {
              id: "edge_2",
              source: "approver_1",
              target: "end_1",
            },
          ],
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        break;

      case "standard":
        // 标准审批：发起人 -> 部门经理 -> 技术专家 -> 结束
        flow = {
          id: `knowledge_flow_${Date.now()}`,
          name: "知识库标准审批流程",
          description: "适用于重要知识内容的标准审批流程",
          nodes: [
            {
              id: "start_1",
              name: "发起人",
              type: ApprovalNodeType.START,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 100 },
            },
            {
              id: "approver_1",
              name: "部门经理审批",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["部门经理"],
              requiredApprovers: ["部门经理"],
              isRequired: true,
              position: { x: 100, y: 200 },
            },
            {
              id: "approver_2",
              name: "技术专家审核",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["技术专家", "架构师"],
              requiredApprovers: ["技术专家"],
              isRequired: true,
              position: { x: 100, y: 300 },
            },
            {
              id: "end_1",
              name: "结束",
              type: ApprovalNodeType.END,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 400 },
            },
          ],
          edges: [
            {
              id: "edge_1",
              source: "start_1",
              target: "approver_1",
            },
            {
              id: "edge_2",
              source: "approver_1",
              target: "approver_2",
            },
            {
              id: "edge_3",
              source: "approver_2",
              target: "end_1",
            },
          ],
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        break;

      case "strict":
        // 严格审批：发起人 -> 部门经理 -> 技术专家 -> 质量审核 -> 结束
        flow = {
          id: `knowledge_flow_${Date.now()}`,
          name: "知识库严格审批流程",
          description: "适用于核心知识内容的严格审批流程",
          nodes: [
            {
              id: "start_1",
              name: "发起人",
              type: ApprovalNodeType.START,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 100 },
            },
            {
              id: "approver_1",
              name: "部门经理审批",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["部门经理"],
              requiredApprovers: ["部门经理"],
              isRequired: true,
              position: { x: 100, y: 180 },
            },
            {
              id: "approver_2",
              name: "技术专家审核",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["技术专家", "架构师"],
              requiredApprovers: ["技术专家"],
              isRequired: true,
              position: { x: 100, y: 260 },
            },
            {
              id: "approver_3",
              name: "质量审核",
              type: ApprovalNodeType.APPROVER,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: ["质量专员", "产品经理"],
              requiredApprovers: ["质量专员"],
              isRequired: true,
              position: { x: 100, y: 340 },
            },
            {
              id: "end_1",
              name: "结束",
              type: ApprovalNodeType.END,
              module: ApprovalModule.KNOWLEDGE_BASE,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 420 },
            },
          ],
          edges: [
            {
              id: "edge_1",
              source: "start_1",
              target: "approver_1",
            },
            {
              id: "edge_2",
              source: "approver_1",
              target: "approver_2",
            },
            {
              id: "edge_3",
              source: "approver_2",
              target: "approver_3",
            },
            {
              id: "edge_4",
              source: "approver_3",
              target: "end_1",
            },
          ],
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        break;

      default:
        flow = {
          id: `knowledge_flow_${Date.now()}`,
          name: "知识库审批流程",
          description: "知识库内容审批流程",
          nodes: [],
          edges: [],
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
    }

    addFlow(flow);
    setCurrentFlow(flow);
    message.success(
      `知识库${templateType === "simple" ? "简单" : templateType === "standard" ? "标准" : "严格"}审批流程创建成功`
    );
  };

  /**
   * 处理流程编辑
   */
  const handleFlowEdit = (flow: ApprovalFlow) => {
    setEditingFlow(flow);
    setFlowEditVisible(true);
  };

  /**
   * 处理流程保存
   */
  const handleFlowSave = () => {
    if (!editingFlow) return;

    if (editingFlow.id) {
      updateCurrentFlow(editingFlow);
    } else {
      const newFlow = {
        ...editingFlow,
        id: `knowledge_flow_${Date.now()}`,
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addFlow(newFlow);
    }

    setFlowEditVisible(false);
    setEditingFlow(null);
    message.success("流程保存成功");
  };

  /**
   * 处理创建新流程
   */
  const handleCreateFlow = () => {
    const newFlow: ApprovalFlow = {
      id: `knowledge_flow_${Date.now()}`,
      name: "新知识库审批流程",
      description: "知识库内容审批流程",
      nodes: [],
      edges: [],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addFlow(newFlow);
    message.success("新流程创建成功");
  };

  /**
   * 处理右键菜单
   */
  const handleContextMenu = (nodeId: string, x: number, y: number) => {
    setContextMenuVisible(true);
    setContextMenuX(x);
    setContextMenuY(y);
    setContextMenuNodeId(nodeId);
  };

  /**
   * 处理删除节点
   */
  const handleDeleteNode = () => {
    if (!contextMenuNodeId) return;
    // 这里需要实现节点删除逻辑
    setContextMenuVisible(false);
  };

  /**
   * 处理节点编辑
   */
  const handleNodeEdit = (node: ApprovalNode) => {
    setEditingNode(node);
    setNodeEditModalVisible(true);
  };

  /**
   * 处理节点删除
   */
  const handleNodeDelete = (nodeId: string) => {
    if (!currentFlow) return;

    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.filter((n) => n.id !== nodeId),
      edges: currentFlow.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    };
    updateCurrentFlow(updatedFlow);
    message.success("节点删除成功");
  };

  /**
   * 处理添加节点
   */
  const handleAddNode = () => {
    // 这里可以实现添加节点的逻辑
    message.info("请从左侧节点面板拖拽节点到画布");
  };

  /**
   * 处理删除边
   */
  const handleDeleteEdge = () => {
    if (selectedEdge && currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        edges: currentFlow.edges.filter((e) => e.id !== selectedEdge.id),
      };
      updateCurrentFlow(updatedFlow);
      setSelectedEdge(null);
      message.success("连线删除成功");
    }
  };

  /**
   * 处理添加边
   */
  const handleEdgeAdd = (edge: {
    id: string;
    source: string;
    target: string;
  }) => {
    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        edges: [...currentFlow.edges, edge],
      };
      updateCurrentFlow(updatedFlow);
    }
  };

  /**
   * 处理节点位置变化
   */
  const handleNodePositionChange = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        nodes: currentFlow.nodes.map((n) =>
          n.id === nodeId ? { ...n, position } : n
        ),
      };
      updateCurrentFlow(updatedFlow);
    }
  };

  /**
   * 处理自动布局
   */
  const handleAutoLayout = () => {
    if (!currentFlow || currentFlow.nodes.length === 0) {
      message.warning("没有节点需要布局");
      return;
    }

    // 简单的自动布局逻辑
    const baseX = 100;
    const baseY = 100;
    const nodeWidth = 200;
    const nodeHeight = 80;
    const spacing = 50;

    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.map((node, index) => ({
        ...node,
        position: {
          x: baseX,
          y: baseY + index * (nodeHeight + spacing),
        },
      })),
    };
    updateCurrentFlow(updatedFlow);
    message.success("自动布局完成");
  };

  /**
   * 处理清除选择
   */
  const handleClearSelection = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  /**
   * 处理刷新
   */
  const handleRefresh = () => {
    // 刷新当前流程
    message.success("刷新完成");
  };

  /**
   * 处理删除流程
   */
  const handleDeleteFlow = () => {
    if (!currentFlow) {
      message.warning("请先选择要删除的流程");
      return;
    }

    Modal.confirm({
      title: "确认删除",
      content: `确定要删除审批流程"${currentFlow.name}"吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        deleteFlow(currentFlow.id);
        message.success("流程删除成功");
      },
    });
  };

  /**
   * 处理空白区域点击
   */
  const handleBlankClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // 设置知识库默认审批流
  const setKnowledgeBaseDefaultFlow = (flowId: string) => {
    const flows = getLatestFlows();
    flows.forEach((f: any) => {
      f.isKnowledgeBaseDefault = f.id === flowId;
      f.isActive = f.id === flowId; // 设为默认的激活，其余取消激活
    });
    localStorage.setItem("approvalFlows", JSON.stringify(flows));
    message.success("已设为知识库默认审批流程");
    setLocalFlows(getLatestFlows()); // 立即刷新本地卡片
    setRefreshKey((k) => k + 1); // 触发页面刷新
  };

  // 当前选中流程id
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  // 点击卡片时切换选中流程
  const handleCardClick = (flowId: string) => {
    setSelectedFlowId(flowId);
    const flow = localFlows.find((f: any) => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  // 页面初始化时默认选中第一个流程
  useEffect(() => {
    if (localFlows.length > 0 && !selectedFlowId) {
      setSelectedFlowId(localFlows[0].id);
      setCurrentFlow(localFlows[0]);
    }
  }, [localFlows]);

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SettingOutlined />
            <span>知识库审批流配置</span>
          </div>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleCreateFlow}>
              新建流程
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteFlow}>
              删除流程
            </Button>
          </Space>
        }
      >
        {/* 快速创建模板卡片区 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {TEMPLATE_LIST.map((template) => (
            <Col span={8} key={template.type}>
              <Card
                title={template.name}
                actions={[
                  <Button
                    type="primary"
                    onClick={() =>
                      createKnowledgeFlowTemplate(template.type as any)
                    }
                  >
                    一键创建
                  </Button>,
                ]}
                style={{ background: "#f6fffa", border: "1px solid #b7eb8f" }}
              >
                <div style={{ marginBottom: 8 }}>{template.desc}</div>
                <div style={{ fontSize: 13, color: "#52c41a" }}>
                  {template.preview.map((node, idx) => (
                    <span key={node}>
                      {node}
                      {idx < template.preview.length - 1 && (
                        <span style={{ margin: "0 4px", color: "#b7eb8f" }}>
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 审批流程卡片区 */}
        <Row gutter={[16, 16]}>
          {localFlows
            .filter(
              (flow: any) =>
                flow.nodes.some(
                  (node: any) => node.module === ApprovalModule.KNOWLEDGE_BASE
                ) ||
                flow.name.includes("知识库") ||
                (flow.description && flow.description.includes("知识库"))
            )
            .map((flow: any) => {
              const flowWithDefault = flow as any;
              const isSelected = selectedFlowId === flow.id;
              return (
                <Col span={8} key={flow.id}>
                  <Card
                    onClick={() => handleCardClick(flow.id)}
                    title={
                      <span>
                        {flow.name}
                        {flowWithDefault.isKnowledgeBaseDefault && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            知识库默认流程
                          </Tag>
                        )}
                      </span>
                    }
                    extra={
                      <Button
                        type={
                          flowWithDefault.isKnowledgeBaseDefault
                            ? "primary"
                            : "default"
                        }
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setKnowledgeBaseDefaultFlow(flow.id);
                        }}
                        disabled={flowWithDefault.isKnowledgeBaseDefault}
                      >
                        {flowWithDefault.isKnowledgeBaseDefault
                          ? "已设为默认"
                          : "设为知识库默认流程"}
                      </Button>
                    }
                    actions={[
                      <Button
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlowEdit(flow);
                        }}
                        key="edit"
                      >
                        编辑
                      </Button>,
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFlow(flow.id);
                        }}
                        key="delete"
                      >
                        删除
                      </Button>,
                    ]}
                    style={{
                      borderColor: isSelected
                        ? "#52c41a"
                        : flowWithDefault.isKnowledgeBaseDefault
                          ? "#1677ff"
                          : undefined,
                      boxShadow: isSelected
                        ? "0 0 12px #b7eb8f88"
                        : flowWithDefault.isKnowledgeBaseDefault
                          ? "0 0 8px #1677ff22"
                          : undefined,
                      marginBottom: 16,
                      cursor: "pointer",
                      background: isSelected
                        ? "linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%)"
                        : flowWithDefault.isKnowledgeBaseDefault
                          ? "linear-gradient(135deg, #e6f4ff 0%, #91caff 100%)"
                          : undefined,
                      transition:
                        "background 0.4s, box-shadow 0.4s, border-color 0.4s",
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      {(flow.description as string | undefined) ?? "无描述"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#888", marginBottom: 8 }}
                    >
                      节点数：{flow.nodes.length}，创建时间：
                      {flow.createdAt.slice(0, 10)}
                    </div>
                    {/* 主要节点流转预览 */}
                    <div
                      style={{
                        fontSize: 13,
                        color: "#1677ff",
                        marginBottom: 8,
                      }}
                    >
                      {flow.nodes
                        .filter((n: any) => n.type !== ApprovalNodeType.END)
                        .slice(0, 5)
                        .map((node: any, idx: number, arr: any[]) => (
                          <span key={node.id}>
                            {node.name}
                            {idx < arr.length - 1 && (
                              <span
                                style={{ margin: "0 4px", color: "#b5cdfa" }}
                              >
                                →
                              </span>
                            )}
                          </span>
                        ))}
                      {flow.nodes.filter(
                        (n: any) => n.type !== ApprovalNodeType.END
                      ).length > 5 && (
                        <span style={{ color: "#ccc" }}>...</span>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
        </Row>

        {/* 流程编辑器 */}
        <GraphEditor
          key={selectedFlowId}
          currentFlow={
            localFlows.find((f: any) => f.id === selectedFlowId) || currentFlow
          }
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeSelect={setSelectedNode}
          onEdgeSelect={setSelectedEdge}
          onContextMenu={handleContextMenu}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={handleNodeDelete}
          onAddNode={handleAddNode}
          onDeleteEdge={handleDeleteEdge}
          onEdgeAdd={handleEdgeAdd}
          onNodePositionChange={handleNodePositionChange}
          onAutoLayout={handleAutoLayout}
          onClearSelection={handleClearSelection}
          onFlowUpdate={updateCurrentFlow}
        />

        {/* 流程编辑弹窗 */}
        <FlowEditModal
          visible={flowEditVisible}
          editingFlow={editingFlow}
          onFlowChange={setEditingFlow}
          onCancel={() => {
            setFlowEditVisible(false);
            setEditingFlow(null);
          }}
          onOk={handleFlowSave}
        />

        {/* 右键菜单 */}
        <ContextMenu
          visible={contextMenuVisible}
          x={contextMenuX}
          y={contextMenuY}
          onDelete={handleDeleteNode}
          onClose={() => setContextMenuVisible(false)}
          onNodeSelect={() => {}}
        />
      </Card>
    </div>
  );
};

export default KnowledgeApprovalFlow;
