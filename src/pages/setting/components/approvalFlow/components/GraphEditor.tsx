import React, { useRef, useEffect, useState } from "react";
import { Button, Space } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Graph, Node, Edge } from "@antv/x6";
import { Dnd } from "@antv/x6-plugin-dnd";
import { ApprovalFlow, ApprovalNode, ApprovalNodeType } from "./types";
import { getNodeIcon, getNodeTypeClass } from "./utils";
import NodePalette from "./NodePalette";
import NodePropertyPanel from "./NodePropertyPanel";
import "./GraphEditor.css";

interface GraphEditorProps {
  currentFlow: ApprovalFlow | null;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeSelect: (node: Node | null) => void;
  onEdgeSelect: (edge: Edge | null) => void;
  onAddNode: () => void;
  onDeleteEdge: () => void;
  onNodeEdit: (node: ApprovalNode) => void;
  onNodeDelete: (nodeId: string) => void;
  onContextMenu: (nodeId: string, x: number, y: number) => void;
  onNodePositionChange?: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
  onAutoLayout?: () => void;
  onClearSelection?: () => void;
  onEdgeAdd?: (edge: { id: string; source: string; target: string }) => void;
  onFlowUpdate: (
    flowOrUpdater:
      | ApprovalFlow
      | ((prevFlow: ApprovalFlow | null) => ApprovalFlow)
  ) => void;
}

/**
 * 图形编辑器组件
 */
const GraphEditor: React.FC<GraphEditorProps> = ({
  currentFlow,
  selectedNode,
  selectedEdge,
  onNodeSelect,
  onEdgeSelect,
  onAddNode,
  onDeleteEdge,
  onNodeEdit,
  onNodeDelete,
  onContextMenu,
  onNodePositionChange,
  onAutoLayout,
  onClearSelection,
  onEdgeAdd,
  onFlowUpdate,
}) => {
  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dndRef = useRef<Dnd | null>(null);

  // 初始化图形
  useEffect(() => {
    if (containerRef.current && currentFlow) {
      // 创建图形实例
      const graph: Graph = new Graph({
        container: containerRef.current,
        grid: true,
        background: { color: "#f7f8fa" },
        mousewheel: {
          enabled: true,
          modifiers: ["ctrl", "meta"],
        },
        connecting: {
          snap: true,
          allowBlank: false,
          allowLoop: false,
          highlight: true,
          connector: "smooth",
          connectionPoint: "boundary",
          anchor: "center",
          allowNode: false,
          allowEdge: false,
          allowPort: true,
          allowMulti: true,
          validateConnection({
            sourceView,
            targetView,
            sourceMagnet,
            targetMagnet,
          }) {
            // 获取源节点和目标节点的数据
            const sourceNode = sourceView?.cell;
            const targetNode = targetView?.cell;

            if (!sourceNode || !targetNode) {
              return false;
            }

            const sourceData = sourceNode.getData();
            const targetData = targetNode.getData();

            // 发起人节点只能作为源节点（输出）
            if (sourceData?.type === ApprovalNodeType.START) {
              // 发起人只能输出，不能作为目标
              if (targetData?.type === ApprovalNodeType.START) {
                return false;
              }
            }

            // 结束节点只能作为目标节点（输入）
            if (targetData?.type === ApprovalNodeType.END) {
              // 结束节点只能输入，不能作为源
              if (sourceData?.type === ApprovalNodeType.END) {
                return false;
              }
            }

            // 不能从结束节点连接到其他节点
            if (sourceData?.type === ApprovalNodeType.END) {
              return false;
            }

            // 不能连接到发起人节点
            if (targetData?.type === ApprovalNodeType.START) {
              return false;
            }

            return true;
          },
          createEdge(): Edge {
            return graph.createEdge({
              shape: "edge",
              attrs: {
                line: {
                  stroke: "#5F95FF",
                  strokeWidth: 2,
                  targetMarker: {
                    name: "block",
                    width: 12,
                    height: 8,
                  },
                },
              },
            });
          },
        },
      });

      // 添加节点
      currentFlow.nodes.forEach((node) => {
        const nodeTypeClass = getNodeTypeClass(node.type);
        const icon = getNodeIcon(node.type);

        // 根据节点类型配置端口
        const portItems = [];
        if (node.type !== ApprovalNodeType.START) {
          portItems.push({ id: "in", group: "in" });
        }
        if (node.type !== ApprovalNodeType.END) {
          portItems.push({ id: "out", group: "out" });
        }

        const graphNode = graph.addNode({
          id: node.id,
          shape: "rect",
          x: node.position.x,
          y: node.position.y,
          width: 200,
          height: 80,
          attrs: {
            body: {
              stroke: "#d9d9d9",
              strokeWidth: 1,
              fill: "#fff",
              rx: 6,
              ry: 6,
            },
            label: {
              text: `${icon} ${node.name}`,
              fill: "#333",
              fontSize: 12,
              textAnchor: "middle",
              textVerticalAnchor: "middle",
            },
          },
          ports: {
            groups: {
              in: {
                position: "top",
                attrs: {
                  circle: {
                    r: 6,
                    magnet: true,
                    stroke: "#5F95FF",
                    strokeWidth: 2,
                    fill: "#fff",
                  },
                },
                label: {
                  position: "top",
                },
              },
              out: {
                position: "bottom",
                attrs: {
                  circle: {
                    r: 6,
                    magnet: true,
                    stroke: "#5F95FF",
                    strokeWidth: 2,
                    fill: "#fff",
                  },
                },
                label: {
                  position: "bottom",
                },
              },
            },
            items: portItems.map((port) => {
              // 为发起人节点的输入端口和结束节点的输出端口设置不可用
              if (
                (node.type === ApprovalNodeType.START && port.id === "in") ||
                (node.type === ApprovalNodeType.END && port.id === "out")
              ) {
                return {
                  ...port,
                  attrs: {
                    circle: {
                      r: 6,
                      magnet: false, // 不可连接
                      stroke: "#d9d9d9",
                      strokeWidth: 1,
                      fill: "#f5f5f5",
                    },
                  },
                };
              }
              return port;
            }),
          },
          data: {
            ...node,
            type: node.type, // 确保type属性在data中
          },
        });
      });

      // 添加边
      currentFlow.edges.forEach((edge) => {
        const graphEdge = graph.addEdge({
          id: edge.id,
          source: { cell: edge.source, port: "out" },
          target: { cell: edge.target, port: "in" },
          label: edge.label,
          attrs: {
            line: {
              stroke: "#5F95FF",
              strokeWidth: 2,
              targetMarker: {
                name: "block",
                width: 12,
                height: 8,
              },
            },
          },
        });
      });

      // 恢复选中状态（只在流程切换时同步一次）
      if (currentFlow.selectedNodeId) {
        const selectedNode = graph.getCellById(
          currentFlow.selectedNodeId
        ) as Node;
        if (selectedNode) {
          selectedNode.setAttrByPath("body/stroke", "#1890ff");
          selectedNode.setAttrByPath("body/strokeWidth", 3);
        }
      } else if (currentFlow.selectedEdgeId) {
        const selectedEdge = graph.getCellById(
          currentFlow.selectedEdgeId
        ) as Edge;
        if (selectedEdge) {
          selectedEdge.setAttrByPath("line/stroke", "#1890ff");
          selectedEdge.setAttrByPath("line/strokeWidth", 3);
        }
      }

      // 节点拖拽结束事件
      graph.on("node:moved", ({ node }: { node: Node }) => {
        const nodeData = node.getData();
        if (nodeData && onNodePositionChange) {
          const position = node.getPosition();
          onNodePositionChange(nodeData.id, position);
        }
      });

      // 连线创建事件
      graph.on("edge:connected", ({ edge }: { edge: Edge }) => {
        const source = edge.getSource();
        const target = edge.getTarget();
        const getCellId = (end: any) => {
          if (typeof end === "string") return end;
          if (end && typeof end === "object" && "cell" in end) return end.cell;
          return "";
        };
        const sourceId = getCellId(source);
        const targetId = getCellId(target);

        // 校验节点是否存在
        if (
          !currentFlow?.nodes.find((n) => n.id === sourceId) ||
          !currentFlow?.nodes.find((n) => n.id === targetId)
        ) {
          // 不添加无效连线
          if (typeof window !== "undefined" && window.console) {
            // 只在开发环境提示
            // eslint-disable-next-line no-console
            console.warn("连线的节点不存在，操作被忽略", sourceId, targetId);
          }
          return;
        }

        const newEdge = {
          id: edge.id,
          source: sourceId,
          target: targetId,
        };

        if (onEdgeAdd) {
          onEdgeAdd(newEdge);
        }
      });

      // 节点选中事件
      graph.on("node:click", ({ node }: { node: Node }) => {
        // 只做高亮，不触发 updateCurrentFlow
        graph.getNodes().forEach((n: Node) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });
        graph.getEdges().forEach((e: Edge) => {
          e.setAttrByPath("line/stroke", "#5F95FF");
          e.setAttrByPath("line/strokeWidth", 2);
        });
        node.setAttrByPath("body/stroke", "#1890ff");
        node.setAttrByPath("body/strokeWidth", 3);
        onNodeSelect?.(node);
        // 打开节点编辑弹窗
        const nodeData = currentFlow.nodes.find((n) => n.id === node.id);
        if (nodeData) {
          onNodeEdit(nodeData);
        }
      });

      // 边选中事件
      graph.on("edge:click", ({ edge }: { edge: Edge }) => {
        // 只做高亮，不触发 updateCurrentFlow
        graph.getNodes().forEach((n: Node) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });
        graph.getEdges().forEach((e: Edge) => {
          e.setAttrByPath("line/stroke", "#5F95FF");
          e.setAttrByPath("line/strokeWidth", 2);
        });
        edge.setAttrByPath("line/stroke", "#1890ff");
        edge.setAttrByPath("line/strokeWidth", 3);
        onEdgeSelect?.(edge);
      });

      // 画布点击事件
      graph.on("blank:click", () => {
        graph.getNodes().forEach((n: Node) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });
        graph.getEdges().forEach((e: Edge) => {
          e.setAttrByPath("line/stroke", "#5F95FF");
          e.setAttrByPath("line/strokeWidth", 2);
        });
        if (onClearSelection) {
          onClearSelection();
        }
      });

      // 右键菜单事件
      graph.on("node:contextmenu", ({ node, e }: { node: Node; e: any }) => {
        e.preventDefault();
        onContextMenu(node.id, e.clientX, e.clientY);
      });

      // 点击画布关闭菜单
      graph.on("blank:click", () => {
        // 这里可以添加关闭右键菜单的逻辑
      });

      graphRef.current = graph;

      return () => {
        graph.dispose();
      };
    }
  }, [
    currentFlow?.id, // 只在流程ID变化时重新创建图形
    currentFlow?.nodes, // 节点变化时重新创建
    currentFlow?.edges, // 边变化时重新创建
    onNodeSelect,
    onEdgeSelect,
    onNodeEdit,
    onContextMenu,
    onNodePositionChange,
    onClearSelection,
    onEdgeAdd,
  ]);

  // 拖拽节点到画布
  useEffect(() => {
    if (!graphRef.current) return;
    dndRef.current = new Dnd({
      target: graphRef.current,
      scaled: false,
    });
  }, [graphRef.current]);

  // 拖拽开始
  const handlePaletteDragStart = (
    type: ApprovalNodeType,
    e: React.DragEvent
  ) => {
    if (!graphRef.current || !dndRef.current) return;
    const id = `node_${Date.now()}`;

    // 计算新节点位置，避免重叠
    const baseX = 100;
    const baseY = 100;
    const nodeSpacing = 50;
    const nodeCount = currentFlow?.nodes.length || 0;
    const position = {
      x: baseX + (nodeCount % 3) * (200 + nodeSpacing), // 每行最多3个节点
      y: baseY + Math.floor(nodeCount / 3) * (80 + nodeSpacing), // 每列间距
    };

    const safeNode: ApprovalNode = {
      id,
      name: "新节点",
      type,
      approvers: [],
      requiredApprovers: [],
      isRequired: false,
      position,
    };
    // 回调式追加节点，避免节点丢失
    onFlowUpdate((prevFlow: ApprovalFlow | null) => {
      if (!prevFlow) {
        // 在实践中，拖拽时 currentFlow 应该始终存在，
        // 但为了类型安全和健壮性，我们返回原始值
        return prevFlow as any;
      }
      return {
        ...prevFlow,
        nodes: [...prevFlow.nodes, safeNode],
        updatedAt: new Date().toISOString(),
      };
    });
    // 再让X6拖拽
    const node = graphRef.current.createNode({
      id,
      shape: "rect",
      width: 200,
      height: 80,
      x: position.x,
      y: position.y,
      attrs: {
        body: { stroke: "#d9d9d9", strokeWidth: 1, fill: "#fff", rx: 6, ry: 6 },
        label: {
          text: `${getNodeIcon(type)} 新节点`,
          fill: "#333",
          fontSize: 12,
          textAnchor: "middle",
          textVerticalAnchor: "middle",
        },
      },
      ports: {
        groups: {
          in: {
            position: "top",
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: "#5F95FF",
                strokeWidth: 2,
                fill: "#fff",
              },
            },
            label: {
              position: "top",
            },
          },
          out: {
            position: "bottom",
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: "#5F95FF",
                strokeWidth: 2,
                fill: "#fff",
              },
            },
            label: {
              position: "bottom",
            },
          },
        },
        items:
          type === ApprovalNodeType.START
            ? [{ id: "out", group: "out" }]
            : type === ApprovalNodeType.END
              ? [{ id: "in", group: "in" }]
              : [
                  { id: "in", group: "in" },
                  { id: "out", group: "out" },
                ],
      },
      data: safeNode,
    });
    dndRef.current.start(node, e.nativeEvent as any);
  };

  // 属性面板编辑
  const handleNodePropertyChange = (updated: ApprovalNode) => {
    onFlowUpdate({
      ...currentFlow!,
      nodes: currentFlow!.nodes.map((n) => (n.id === updated.id ? updated : n)),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="graph-3col-layout">
      <NodePalette onDragStart={handlePaletteDragStart} />
      <div className="graph-canvas-container">
        <div className="flow-header">
          <h3>{currentFlow?.name}</h3>
          <Space>
            <Button icon={<PlusOutlined />} onClick={onAddNode}>
              添加节点
            </Button>
            <Button
              icon={<DeleteOutlined />}
              disabled={!selectedEdge}
              danger
              onClick={onDeleteEdge}
            >
              删除连线
            </Button>
            {onAutoLayout && (
              <Button icon={<ReloadOutlined />} onClick={onAutoLayout}>
                自动布局
              </Button>
            )}
          </Space>
        </div>
        <div className="graph-canvas" ref={containerRef} />
      </div>
      <NodePropertyPanel
        node={
          selectedNode && typeof selectedNode.getData === "function"
            ? (selectedNode.getData() as ApprovalNode)
            : null
        }
        onChange={handleNodePropertyChange}
      />
    </div>
  );
};

export default GraphEditor;
