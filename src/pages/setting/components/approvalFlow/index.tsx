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
    handleNodeDelete(contextMenuNodeId);
    setContextMenuVisible(false);
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

  /**
   * 新增：节点属性编辑和拖拽新增统一用onFlowUpdate
   */
  const handleFlowUpdate = useCallback(
    (
      flowOrUpdater:
        | ApprovalFlow
        | ((prev: ApprovalFlow | null) => ApprovalFlow)
    ) => {
      // 直接将更新函数或对象传递给 useFlowStorage 中的 updateCurrentFlow
      updateCurrentFlow(flowOrUpdater);
    },
    [updateCurrentFlow]
  );

  /**
   * 处理删除连线
   */
  const handleDeleteEdge = useCallback(() => {
    if (!currentFlow || !selectedEdge) {
      message.warning("请先选中要删除的连线");
      return;
    }
    const updatedEdges = currentFlow.edges.filter(
      (edge) => edge.id !== selectedEdge.id
    );
    const updatedFlow = {
      ...currentFlow,
      edges: updatedEdges,
      selectedEdgeId: undefined,
      updatedAt: new Date().toISOString(),
    };
    updateCurrentFlow(updatedFlow);
    setSelectedEdge(null);
    message.success("连线已删除");
  }, [currentFlow, selectedEdge, updateCurrentFlow]);

  /**
   * 删除节点及其相关连线
   * @param nodeId 节点ID
   */
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setSelectedNode(null); // 先清空
      setSelectedEdge(null);
      if (!currentFlow) return;
      // 删除节点
      const updatedNodes = currentFlow.nodes.filter(
        (node) => node.id !== nodeId
      );
      // 删除与该节点相关的所有连线
      const updatedEdges = currentFlow.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      const updatedFlow = {
        ...currentFlow,
        nodes: updatedNodes,
        edges: updatedEdges,
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
        updatedAt: new Date().toISOString(),
      };
      updateCurrentFlow(updatedFlow);
      message.success("节点及相关连线已删除");
    },
    [currentFlow, updateCurrentFlow]
  );

  // 画布空白点击事件处理
  const handleBlankClick = () => {
    setSelectedNode(null);
    setContextMenuVisible(false); // 关闭右键菜单
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
          onNodeSelect={setSelectedNode}
          onEdgeSelect={handleEdgeSelect}
          onAddNode={() => {}} // 不再弹窗
          onDeleteEdge={handleDeleteEdge}
          onNodeEdit={() => {}} // 不再弹窗
          onNodeDelete={handleNodeDelete}
          onContextMenu={handleContextMenu}
          onNodePositionChange={handleNodePositionChange}
          onAutoLayout={handleAutoLayout}
          onClearSelection={handleBlankClick}
          onEdgeAdd={handleEdgeAdd}
          onFlowUpdate={handleFlowUpdate}
        />
      </Card>
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
        visible={contextMenuVisible}
        x={contextMenuX}
        y={contextMenuY}
        onDelete={handleDeleteNode}
        onNodeSelect={setSelectedNode}
        onClose={() => setContextMenuVisible(false)}
      />
    </div>
  );
};

export default ApprovalFlowEditor;
