import React, { useRef, useEffect } from "react";
import { Button, Space } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Graph, Node, Edge } from "@antv/x6";
import { ApprovalFlow, ApprovalNode, ApprovalNodeType } from "./types";
import { getNodeIcon, getNodeTypeClass } from "./utils";

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
}) => {
  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化图形
  useEffect(() => {
    if (containerRef.current && currentFlow) {
      // 创建图形实例
      const graph: Graph = new Graph({
        container: containerRef.current,
        grid: true,
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

        // 创建新的边数据
        const newEdge = {
          id: edge.id,
          source: typeof source === "string" ? source : (source as any).cell,
          target: typeof target === "string" ? target : (target as any).cell,
        };

        // 通知父组件添加边
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

  return (
    <div className="flow-editor" style={{ width: "100%" }}>
      {currentFlow ? (
        <>
          <div className="flow-header">
            <h3>{currentFlow.name}</h3>
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

          <div className="graph-container" ref={containerRef} />
        </>
      ) : (
        <div className="no-flow-selected">
          <p>请选择一个流程或创建新流程</p>
        </div>
      )}
    </div>
  );
};

export default GraphEditor;
