/**
 * @file 审批流程编排组件 - 主入口
 * @description 基于 @antv/x6 的审批流程编排，支持拖拽重新组合流程节点，编辑节点属性
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Space, message, Modal } from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Node, Edge } from "@antv/x6";

// 导入样式文件
import "./style.css";

// 导入拆分后的组件
import NodeEditModal from "./components/NodeEditModal";
import FlowEditModal from "./components/FlowEditModal";
import ContextMenu from "./components/ContextMenu";
import FlowSelector from "./components/FlowSelector";
import GraphEditor from "./components/GraphEditor";
import { useFlowStorage } from "./components/hooks/useFlowStorage";

// 导入类型定义
import {
  ApprovalFlow,
  ApprovalNode,
  ApprovalNodeType,
} from "./components/types";

/**
 * 审批流程编排组件
 */
const ApprovalFlowEditor: React.FC = () => {
  // 使用流程存储钩子
  const {
    flows,
    currentFlow,
    setCurrentFlow,
    updateCurrentFlow,
    addFlow,
    deleteFlow,
  } = useFlowStorage();

  // 状态管理
  const [nodeEditVisible, setNodeEditVisible] = useState(false);
  const [flowEditVisible, setFlowEditVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    nodeId: string;
    x: number;
    y: number;
  }>({
    visible: false,
    nodeId: "",
    x: 0,
    y: 0,
  });
  const [isNewNode, setIsNewNode] = useState(false);

  // 图形引用
  const graphRef = useRef<any>(null);

  // 流程切换时恢复选中状态
  useEffect(() => {
    if (currentFlow) {
      // 恢复节点选中状态
      if (currentFlow.selectedNodeId) {
        // 这里需要从图形实例中获取节点，但图形实例可能还没有创建
        // 所以我们在 GraphEditor 组件中处理这个逻辑
        // 先设置状态为 null，让 GraphEditor 组件来处理恢复
        setSelectedNode(null);
        setSelectedEdge(null);
      } else if (currentFlow.selectedEdgeId) {
        // 恢复边选中状态
        setSelectedNode(null);
        setSelectedEdge(null);
      } else {
        // 清除选中状态
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    } else {
      // 清除选中状态
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [currentFlow?.id]); // 只在流程ID变化时执行

  /**
   * 处理节点编辑
   */
  const handleNodeEdit = (node: ApprovalNode) => {
    setEditingNode(node);
    setIsNewNode(false);
    setNodeEditVisible(true);
  };

  /**
   * 处理节点保存
   */
  const handleNodeSave = (updatedNode: ApprovalNode) => {
    if (!currentFlow) return;

    // 检查是新增节点还是更新现有节点
    const existingNodeIndex = currentFlow.nodes.findIndex(
      (node) => node.id === updatedNode.id
    );

    let updatedNodes;
    if (existingNodeIndex >= 0) {
      // 更新现有节点
      updatedNodes = currentFlow.nodes.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      );
    } else {
      // 添加新节点
      updatedNodes = [...currentFlow.nodes, updatedNode];
    }

    const updatedFlow = {
      ...currentFlow,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    updateCurrentFlow(updatedFlow);
    setNodeEditVisible(false);
    setEditingNode(null);
    setIsNewNode(false);
    message.success(existingNodeIndex >= 0 ? "节点更新成功" : "节点添加成功");
  };

  /**
   * 处理添加节点
   */
  const handleAddNode = () => {
    if (!currentFlow) {
      message.warning("请先选择或创建一个流程");
      return;
    }

    // 计算新节点的位置，避免重叠
    const calculateNewPosition = (): { x: number; y: number } => {
      const existingNodes = currentFlow.nodes;
      const baseX = 100;
      const baseY = 100;
      const nodeWidth = 200;
      const nodeHeight = 80;
      const spacing = 50; // 节点之间的间距
      const maxNodesPerRow = 3; // 每行最多显示的节点数

      if (existingNodes.length === 0) {
        // 第一个节点放在左上角
        return { x: baseX, y: baseY };
      }

      // 检查位置是否与现有节点重叠
      const isPositionOccupied = (x: number, y: number): boolean => {
        return existingNodes.some((existingNode) => {
          const existingX = existingNode.position.x;
          const existingY = existingNode.position.y;

          // 检查两个矩形是否重叠
          return (
            x < existingX + nodeWidth + spacing &&
            x + nodeWidth + spacing > existingX &&
            y < existingY + nodeHeight + spacing &&
            y + nodeHeight + spacing > existingY
          );
        });
      };

      // 尝试找到合适的位置
      let attempts = 0;
      const maxAttempts = 20; // 最大尝试次数

      while (attempts < maxAttempts) {
        // 计算当前行和列
        const currentRow = Math.floor(
          (existingNodes.length + attempts) / maxNodesPerRow
        );
        const currentCol = (existingNodes.length + attempts) % maxNodesPerRow;

        // 计算新位置
        const newX = baseX + currentCol * (nodeWidth + spacing);
        const newY = baseY + currentRow * (nodeHeight + spacing);

        // 检查位置是否可用
        if (!isPositionOccupied(newX, newY)) {
          return { x: newX, y: newY };
        }

        attempts++;
      }

      // 如果找不到合适的位置，使用最后一个节点的位置加上偏移
      const lastNode = existingNodes[existingNodes.length - 1];
      return {
        x: lastNode.position.x + nodeWidth + spacing,
        y: lastNode.position.y,
      };
    };

    const newNode: ApprovalNode = {
      id: `node_${Date.now()}`,
      name: "新节点",
      type: ApprovalNodeType.APPROVER,
      approvers: [],
      requiredApprovers: [],
      isRequired: true,
      position: calculateNewPosition(),
    };

    setEditingNode(newNode);
    setIsNewNode(true);
    setNodeEditVisible(true);
  };

  /**
   * 处理节点删除
   */
  const handleNodeDelete = (nodeId: string) => {
    if (!currentFlow) return;

    // 删除节点
    const updatedNodes = currentFlow.nodes.filter((node) => node.id !== nodeId);

    // 删除相关的边
    const updatedEdges = currentFlow.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );

    const updatedFlow = {
      ...currentFlow,
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNodeId:
        currentFlow.selectedNodeId === nodeId
          ? undefined
          : currentFlow.selectedNodeId, // 如果删除的是选中的节点，清除选中状态
      updatedAt: new Date().toISOString(),
    };

    updateCurrentFlow(updatedFlow);
    setContextMenu({ ...contextMenu, visible: false });

    // 如果删除的是当前选中的节点，清除选中状态
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }

    message.success("节点删除成功");
  };

  /**
   * 处理删除连线
   */
  const handleDeleteEdge = () => {
    if (!selectedEdge || !currentFlow) return;

    const updatedEdges = currentFlow.edges.filter(
      (edge) => edge.id !== selectedEdge.id
    );

    const updatedFlow = {
      ...currentFlow,
      edges: updatedEdges,
      selectedEdgeId: undefined, // 清除选中状态
      updatedAt: new Date().toISOString(),
    };

    updateCurrentFlow(updatedFlow);
    setSelectedEdge(null);
    message.success("连线删除成功");
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
      // 更新现有流程
      updateCurrentFlow(editingFlow);
    } else {
      // 创建新流程，只包含基本信息，不添加默认节点
      const newFlow = {
        ...editingFlow,
        id: `flow_${Date.now()}`,
        nodes: [], // 空的节点列表
        edges: [], // 空的边列表
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
    // 直接创建新流程，不弹出编辑弹窗
    const newFlow: ApprovalFlow = {
      id: `flow_${Date.now()}`,
      name: "新审批流程",
      description: "",
      //   nodes: [
      //     {
      //       id: "start_1",
      //       name: "发起人",
      //       type: ApprovalNodeType.START,
      //       approvers: [],
      //       requiredApprovers: [],
      //       isRequired: false,
      //       position: { x: 100, y: 100 },
      //     },
      //     {
      //       id: "end_1",
      //       name: "结束",
      //       type: ApprovalNodeType.END,
      //       approvers: [],
      //       requiredApprovers: [],
      //       isRequired: false,
      //       position: { x: 100, y: 300 },
      //     },
      //   ],
      //   edges: [
      //     {
      //       id: "edge_1",
      //       source: "start_1",
      //       target: "end_1",
      //     },
      //   ],
      nodes: [], // 空的节点列表
      edges: [], // 空的边列表
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
    setContextMenu({
      visible: true,
      nodeId,
      x,
      y,
    });
  };

  /**
   * 处理右键菜单删除
   */
  const handleContextMenuDelete = () => {
    handleNodeDelete(contextMenu.nodeId);
  };

  /**
   * 处理自动布局
   */
  const handleAutoLayout = () => {
    if (!currentFlow || currentFlow.nodes.length === 0) {
      message.warning("没有节点需要布局");
      return;
    }

    const baseX = 100;
    const baseY = 100;
    const nodeWidth = 200;
    const nodeHeight = 80;
    const spacing = 50;
    const maxNodesPerRow = 3;

    const updatedNodes = currentFlow.nodes.map((node, index) => {
      const row = Math.floor(index / maxNodesPerRow);
      const col = index % maxNodesPerRow;

      return {
        ...node,
        position: {
          x: baseX + col * (nodeWidth + spacing),
          y: baseY + row * (nodeHeight + spacing),
        },
      };
    });

    const updatedFlow = {
      ...currentFlow,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    updateCurrentFlow(updatedFlow);
    message.success("自动布局完成");
  };

  /**
   * 处理节点位置变化
   */
  const handleNodePositionChange = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    if (!currentFlow) return;

    const updatedNodes = currentFlow.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node
    );

    const updatedFlow = {
      ...currentFlow,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    updateCurrentFlow(updatedFlow);
  };

  /**
   * 处理刷新
   */
  const handleRefresh = () => {
    window.location.reload();
  };

  /**
   * 处理节点选中
   */
  const handleNodeSelect = useCallback(
    (node: Node | null) => {
      setSelectedNode(node);
      setSelectedEdge(null); // 清除边选中状态

      // 保存选中状态到流程数据
      if (currentFlow) {
        const updatedFlow = {
          ...currentFlow,
          selectedNodeId: node?.id || undefined,
          selectedEdgeId: undefined, // 清除边选中状态
          updatedAt: new Date().toISOString(),
        };
        updateCurrentFlow(updatedFlow);
      }
    },
    [currentFlow, updateCurrentFlow]
  );

  /**
   * 处理边选中
   */
  const handleEdgeSelect = useCallback(
    (edge: Edge | null) => {
      setSelectedEdge(edge);
      setSelectedNode(null); // 清除节点选中状态

      // 保存选中状态到流程数据
      if (currentFlow) {
        const updatedFlow = {
          ...currentFlow,
          selectedNodeId: undefined, // 清除节点选中状态
          selectedEdgeId: edge?.id || undefined,
          updatedAt: new Date().toISOString(),
        };
        updateCurrentFlow(updatedFlow);
      }
    },
    [currentFlow, updateCurrentFlow]
  );

  /**
   * 处理连线创建
   */
  const handleEdgeAdd = useCallback(
    (edge: { id: string; source: string; target: string }) => {
      if (!currentFlow) return;

      const updatedEdges = [...currentFlow.edges, edge];
      const updatedFlow = {
        ...currentFlow,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };

      updateCurrentFlow(updatedFlow);
      message.success("连线创建成功");
    },
    [currentFlow, updateCurrentFlow]
  );

  /**
   * 处理清除选中状态
   */
  const handleClearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);

    // 保存选中状态到流程数据
    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
        updatedAt: new Date().toISOString(),
      };
      updateCurrentFlow(updatedFlow);
    }
  }, [currentFlow, updateCurrentFlow]);

  // 删除流程方法
  const handleDeleteFlow = () => {
    if (!currentFlow) {
      message.warning("请先选择要删除的流程");
      return;
    }
    if (flows.length <= 1) {
      message.warning("至少保留一个流程，无法删除最后一个流程");
      return;
    }
    Modal.confirm({
      title: "确认删除该流程？",
      content: `流程名称：${currentFlow.name}`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        deleteFlow(currentFlow.id);
        message.success("流程已删除");
      },
    });
  };

  return (
    <div className="approval-flow-editor">
      <Card
        title="审批流程编排"
        extra={
          <Space>
            <FlowSelector
              flows={flows}
              currentFlow={currentFlow}
              onFlowChange={setCurrentFlow}
              onCreateFlow={handleCreateFlow}
              onEditFlow={handleFlowEdit}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteFlow}>
              删除流程
            </Button>
          </Space>
        }
      >
        <GraphEditor
          currentFlow={currentFlow}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
          onAddNode={handleAddNode}
          onDeleteEdge={handleDeleteEdge}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={handleNodeDelete}
          onContextMenu={handleContextMenu}
          onNodePositionChange={handleNodePositionChange}
          onAutoLayout={handleAutoLayout}
          onClearSelection={handleClearSelection}
          onEdgeAdd={handleEdgeAdd}
        />
      </Card>

      {/* 节点编辑弹窗 */}
      <NodeEditModal
        visible={nodeEditVisible}
        node={editingNode || undefined}
        isNew={isNewNode}
        onCancel={() => {
          setNodeEditVisible(false);
          setEditingNode(null);
          setIsNewNode(false);
        }}
        onOk={handleNodeSave}
      />

      {/* 流程编辑弹窗 */}
      <FlowEditModal
        visible={flowEditVisible}
        editingFlow={editingFlow}
        onCancel={() => {
          setFlowEditVisible(false);
          setEditingFlow(null);
        }}
        onOk={handleFlowSave}
        onFlowChange={setEditingFlow}
      />

      {/* 右键菜单 */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onDelete={handleContextMenuDelete}
      />
    </div>
  );
};

export default ApprovalFlowEditor;
