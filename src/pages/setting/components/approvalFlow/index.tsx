/**
 * @file 审批流程编排组件 - 基于 @antv/x6
 * @description 支持拖拽重新组合流程节点，编辑节点属性，选择审批模块、审批人、必审人，邮件催办
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tooltip,
  Popconfirm,
  Divider,
  Tag,
  Row,
  Col,
  Switch,
  InputNumber,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  SettingOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import { Graph, Node, Edge } from "@antv/x6";
import "./style.less";

const { Option } = Select;
const { TextArea } = Input;

/**
 * 审批节点类型枚举
 */
export enum ApprovalNodeType {
  START = "start", // 发起人
  APPROVER = "approver", // 审批人
  CONDITION = "condition", // 条件分支
  PARALLEL = "parallel", // 并行审批
  AUTO = "auto", // 自动审批
  EMAIL = "email", // 邮件催办
  END = "end", // 结束节点
}

/**
 * 审批模块枚举
 */
export enum ApprovalModule {
  KNOWLEDGE_BASE = "knowledge_base", // 知识库
  DOCUMENT = "document", // 文档
  PROJECT = "project", // 项目
  EXPENSE = "expense", // 费用
  LEAVE = "leave", // 请假
  PURCHASE = "purchase", // 采购
}

/**
 * 审批节点接口
 */
export interface ApprovalNode {
  id: string;
  name: string;
  type: ApprovalNodeType;
  module?: ApprovalModule; // 审批模块
  approvers: string[]; // 审批人列表
  requiredApprovers: string[]; // 必审人列表
  description?: string; // 节点描述
  conditions?: string[]; // 条件（用于条件分支）
  autoApprove?: boolean; // 是否自动通过（用于自动审批）
  emailTemplate?: string; // 邮件模板（用于邮件催办）
  emailRecipients?: string[]; // 邮件收件人
  emailSubject?: string; // 邮件主题
  timeout?: number; // 超时时间（小时）
  isRequired: boolean; // 是否必须审批
  position: { x: number; y: number }; // 节点位置
}

/**
 * 审批流程接口
 */
export interface ApprovalFlow {
  id: string;
  name: string;
  description?: string;
  nodes: ApprovalNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取模块名称
 */
const getModuleName = (module: ApprovalModule): string => {
  const moduleNames = {
    [ApprovalModule.KNOWLEDGE_BASE]: "知识库",
    [ApprovalModule.DOCUMENT]: "文档",
    [ApprovalModule.PROJECT]: "项目",
    [ApprovalModule.EXPENSE]: "费用",
    [ApprovalModule.LEAVE]: "请假",
    [ApprovalModule.PURCHASE]: "采购",
  };
  return moduleNames[module] || "未知";
};

/**
 * 获取节点类型名称
 */
const getNodeTypeName = (type: ApprovalNodeType): string => {
  const typeNames = {
    [ApprovalNodeType.START]: "发起人",
    [ApprovalNodeType.APPROVER]: "审批人",
    [ApprovalNodeType.CONDITION]: "条件分支",
    [ApprovalNodeType.PARALLEL]: "并行审批",
    [ApprovalNodeType.AUTO]: "自动审批",
    [ApprovalNodeType.EMAIL]: "邮件催办",
    [ApprovalNodeType.END]: "结束节点",
  };
  return typeNames[type] || "未知";
};

/**
 * 获取节点头部背景色
 */
const getNodeHeaderBackground = (type: ApprovalNodeType): string => {
  const backgroundMap = {
    [ApprovalNodeType.START]:
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    [ApprovalNodeType.APPROVER]:
      "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
    [ApprovalNodeType.CONDITION]:
      "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
    [ApprovalNodeType.PARALLEL]:
      "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
    [ApprovalNodeType.AUTO]:
      "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
    [ApprovalNodeType.EMAIL]:
      "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
    [ApprovalNodeType.END]: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
  };
  return (
    backgroundMap[type] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  );
};

/**
 * 节点编辑弹窗组件
 */
const NodeEditModal: React.FC<{
  visible: boolean;
  node?: ApprovalNode;
  onCancel: () => void;
  onOk: (node: ApprovalNode) => void;
}> = ({ visible, node, onCancel, onOk }) => {
  const [form] = Form.useForm();
  const [nodeType, setNodeType] = useState<ApprovalNodeType>(
    node?.type || ApprovalNodeType.APPROVER
  );

  useEffect(() => {
    if (visible && node) {
      form.setFieldsValue({
        ...node,
        approvers: node.approvers || [],
        requiredApprovers: node.requiredApprovers || [],
        conditions: node.conditions || [],
        emailRecipients: node.emailRecipients || [],
      });
      setNodeType(node.type);
    } else if (visible) {
      form.resetFields();
      setNodeType(ApprovalNodeType.APPROVER);
    }
  }, [visible, node, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newNode: ApprovalNode = {
        id: node?.id || `node_${Date.now()}`,
        name: values.name,
        type: nodeType,
        module: values.module,
        approvers: values.approvers || [],
        requiredApprovers: values.requiredApprovers || [],
        description: values.description,
        conditions: values.conditions || [],
        autoApprove: values.autoApprove,
        emailTemplate: values.emailTemplate,
        emailRecipients: values.emailRecipients || [],
        emailSubject: values.emailSubject,
        timeout: values.timeout,
        isRequired: values.isRequired,
        position: node?.position || { x: 100, y: 100 },
      };
      onOk(newNode);
    } catch (error) {
      message.error("请检查表单信息");
    }
  };

  return (
    <Modal
      title={node ? "编辑审批节点" : "新增审批节点"}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="节点名称"
              rules={[{ required: true, message: "请输入节点名称" }]}
            >
              <Input placeholder="请输入节点名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="节点类型"
              rules={[{ required: true, message: "请选择节点类型" }]}
            >
              <Select
                placeholder="请选择节点类型"
                onChange={(value) => setNodeType(value)}
              >
                <Option value={ApprovalNodeType.START}>发起人</Option>
                <Option value={ApprovalNodeType.APPROVER}>审批人</Option>
                <Option value={ApprovalNodeType.CONDITION}>条件分支</Option>
                <Option value={ApprovalNodeType.PARALLEL}>并行审批</Option>
                <Option value={ApprovalNodeType.AUTO}>自动审批</Option>
                <Option value={ApprovalNodeType.EMAIL}>邮件催办</Option>
                <Option value={ApprovalNodeType.END}>结束节点</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {(nodeType === ApprovalNodeType.APPROVER ||
          nodeType === ApprovalNodeType.PARALLEL) && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="module"
                  label="审批模块"
                  rules={[{ required: true, message: "请选择审批模块" }]}
                >
                  <Select placeholder="请选择审批模块">
                    <Option value={ApprovalModule.KNOWLEDGE_BASE}>
                      知识库
                    </Option>
                    <Option value={ApprovalModule.DOCUMENT}>文档</Option>
                    <Option value={ApprovalModule.PROJECT}>项目</Option>
                    <Option value={ApprovalModule.EXPENSE}>费用</Option>
                    <Option value={ApprovalModule.LEAVE}>请假</Option>
                    <Option value={ApprovalModule.PURCHASE}>采购</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isRequired"
                  label="是否必须审批"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="approvers"
              label="审批人"
              rules={[{ required: true, message: "请选择审批人" }]}
            >
              <Select
                mode="tags"
                placeholder="请输入审批人姓名，回车添加"
                allowClear
              />
            </Form.Item>

            <Form.Item name="requiredApprovers" label="必审人">
              <Select
                mode="tags"
                placeholder="请输入必审人姓名，回车添加（可选）"
                allowClear
              />
            </Form.Item>
          </>
        )}

        {nodeType === ApprovalNodeType.CONDITION && (
          <Form.Item
            name="conditions"
            label="条件"
            rules={[{ required: true, message: "请输入条件" }]}
          >
            <Select mode="tags" placeholder="请输入条件，回车添加" allowClear />
          </Form.Item>
        )}

        {nodeType === ApprovalNodeType.AUTO && (
          <Form.Item
            name="autoApprove"
            label="自动审批结果"
            rules={[{ required: true, message: "请选择审批结果" }]}
          >
            <Select placeholder="请选择审批结果">
              <Option value={true}>自动通过</Option>
              <Option value={false}>自动拒绝</Option>
            </Select>
          </Form.Item>
        )}

        {nodeType === ApprovalNodeType.EMAIL && (
          <>
            <Form.Item
              name="emailRecipients"
              label="邮件收件人"
              rules={[{ required: true, message: "请输入邮件收件人" }]}
            >
              <Select
                mode="tags"
                placeholder="请输入邮箱地址，回车添加"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="emailSubject"
              label="邮件主题"
              rules={[{ required: true, message: "请输入邮件主题" }]}
            >
              <Input placeholder="请输入邮件主题" />
            </Form.Item>

            <Form.Item name="emailTemplate" label="邮件模板">
              <TextArea rows={4} placeholder="请输入邮件模板内容（可选）" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="节点描述">
          <TextArea rows={3} placeholder="请输入节点描述（可选）" />
        </Form.Item>

        <Form.Item name="timeout" label="超时时间（小时）">
          <InputNumber
            min={0}
            placeholder="请输入超时时间，0表示不超时"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 审批流程编排主组件
 */
const ApprovalFlowEditor: React.FC = () => {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<ApprovalFlow | null>(null);
  const [nodeEditVisible, setNodeEditVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<ApprovalNode | undefined>(
    undefined
  );
  const [flowEditVisible, setFlowEditVisible] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId?: string;
  }>({ visible: false, x: 0, y: 0 });

  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载流程数据
  const loadFlows = () => {
    const savedFlows = localStorage.getItem("approvalFlows");
    if (savedFlows) {
      const parsedFlows = JSON.parse(savedFlows);
      setFlows(parsedFlows);
      if (parsedFlows.length > 0 && !currentFlow) {
        setCurrentFlow(parsedFlows[0]);
      }
    } else {
      // 创建示例数据
      const sampleFlow: ApprovalFlow = {
        id: "sample_flow_1",
        name: "知识库审批流程",
        description: "知识库内容的审批流程示例",
        nodes: [
          {
            id: "node_start",
            name: "发起人",
            type: ApprovalNodeType.START,
            approvers: [],
            requiredApprovers: [],
            description: "流程发起人",
            isRequired: false,
            position: { x: 100, y: 50 },
          },
          {
            id: "node_1",
            name: "部门经理审批",
            type: ApprovalNodeType.APPROVER,
            module: ApprovalModule.KNOWLEDGE_BASE,
            approvers: ["张经理", "李经理"],
            requiredApprovers: ["张经理"],
            description: "部门经理对知识库内容进行初步审批",
            isRequired: true,
            position: { x: 100, y: 150 },
          },
          {
            id: "node_2",
            name: "邮件催办",
            type: ApprovalNodeType.EMAIL,
            approvers: [],
            requiredApprovers: [],
            emailRecipients: ["approver@company.com"],
            emailSubject: "知识库审批提醒",
            emailTemplate: "您好，有新的知识库内容需要您审批，请及时处理。",
            description: "发送邮件提醒审批人",
            isRequired: false,
            position: { x: 100, y: 250 },
          },
          {
            id: "node_end",
            name: "结束",
            type: ApprovalNodeType.END,
            approvers: [],
            requiredApprovers: [],
            description: "流程结束",
            isRequired: false,
            position: { x: 100, y: 350 },
          },
        ],
        edges: [
          {
            id: "edge_1",
            source: "node_start",
            target: "node_1",
            label: "发起",
          },
          {
            id: "edge_2",
            source: "node_1",
            target: "node_2",
            label: "审批通过",
          },
          {
            id: "edge_3",
            source: "node_2",
            target: "node_end",
            label: "完成",
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const flows = [sampleFlow];
      localStorage.setItem("approvalFlows", JSON.stringify(flows));
      setFlows(flows);
      setCurrentFlow(sampleFlow);
    }
  };

  // 保存流程数据
  const saveFlows = (newFlows: ApprovalFlow[]) => {
    console.log("保存流程数据:", newFlows);
    localStorage.setItem("approvalFlows", JSON.stringify(newFlows));
    setFlows(newFlows);
  };

  useEffect(() => {
    loadFlows();
  }, []);

  // 监控flows状态变化
  useEffect(() => {
    console.log("flows状态更新:", flows);
  }, [flows]);

  // 初始化图形
  useEffect(() => {
    if (containerRef.current && currentFlow) {
      // 创建图形实例
      let graph: Graph;
      graph = new Graph({
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
          createEdge() {
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
              router: {
                name: "normal", // 改为normal路由，更自由的连线
              },
            });
          },
        },
        highlighting: {
          magnetAvailable: {
            name: "stroke",
            args: {
              padding: 4,
              attrs: {
                strokeWidth: 4,
                stroke: "#52c41a",
              },
            },
          },
        },
        interacting: {
          nodeMovable: true,
          edgeMovable: false,
          edgeLabelMovable: false,
          magnetConnectable: true,
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

        graph.addNode({
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
        graph.addEdge({
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

      // 节点选中事件
      graph.on("node:click", ({ node }: { node: Node }) => {
        // 清除之前选中节点的样式
        graph.getNodes().forEach((n) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });

        // 设置当前选中节点的蓝色边框
        node.setAttrByPath("body/stroke", "#1890ff");
        node.setAttrByPath("body/strokeWidth", 3);

        setSelectedNode(node);
        setSelectedEdge(null);

        // 打开节点编辑弹窗
        const nodeData = currentFlow.nodes.find((n) => n.id === node.id);
        if (nodeData) {
          setEditingNode(nodeData);
          setNodeEditVisible(true);
        }
      });

      // 边选中事件
      graph.on("edge:click", ({ edge }: { edge: Edge }) => {
        // 清除节点选中状态
        graph.getNodes().forEach((n) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });

        setSelectedEdge(edge);
        setSelectedNode(null);
      });

      // 画布点击事件
      graph.on("blank:click", () => {
        // 清除所有节点选中状态
        graph.getNodes().forEach((n) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });

        setSelectedNode(null);
        setSelectedEdge(null);
      });

      // 节点拖拽结束事件 - 保存位置信息
      graph.on("node:mouseup", ({ node }: { node: Node }) => {
        if (currentFlow) {
          const position = node.getPosition();
          const updatedNodes = currentFlow.nodes.map((n) =>
            n.id === node.id
              ? { ...n, position: { x: position.x, y: position.y } }
              : n
          );
          const updatedFlow = {
            ...currentFlow,
            nodes: updatedNodes,
            updatedAt: new Date().toISOString(),
          };
          setCurrentFlow(updatedFlow);

          // 更新流程列表
          const updatedFlows = flows.map((flow) =>
            flow.id === updatedFlow.id ? updatedFlow : flow
          );
          saveFlows(updatedFlows);
        }
      });

      // 边连接事件
      graph.on("edge:connected", ({ edge }: { edge: Edge }) => {
        const source = edge.getSource();
        const target = edge.getTarget();
        const newEdge = {
          id: edge.id,
          source: typeof source === "string" ? source : (source as any).cell,
          target: typeof target === "string" ? target : (target as any).cell,
          label: edge.getLabels()?.[0]?.text || "",
        };

        if (currentFlow) {
          const updatedEdges = [...currentFlow.edges, newEdge];
          const updatedFlow = {
            ...currentFlow,
            edges: updatedEdges,
            updatedAt: new Date().toISOString(),
          };
          setCurrentFlow(updatedFlow);

          // 更新流程列表
          const updatedFlows = flows.map((flow) =>
            flow.id === updatedFlow.id ? updatedFlow : flow
          );
          saveFlows(updatedFlows);
        }
      });

      // 边删除事件
      graph.on("edge:removed", ({ edge }: { edge: Edge }) => {
        if (currentFlow) {
          const updatedEdges = currentFlow.edges.filter(
            (e) => e.id !== edge.id
          );
          const updatedFlow = {
            ...currentFlow,
            edges: updatedEdges,
            updatedAt: new Date().toISOString(),
          };
          setCurrentFlow(updatedFlow);

          // 更新流程列表
          const updatedFlows = flows.map((flow) =>
            flow.id === updatedFlow.id ? updatedFlow : flow
          );
          saveFlows(updatedFlows);
        }
      });

      // 右键菜单事件
      graph.on("node:contextmenu", ({ node, e }: { node: Node; e: any }) => {
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          nodeId: node.id,
        });
      });

      // 点击画布关闭菜单
      graph.on("blank:click", () => {
        setContextMenu((m) => ({ ...m, visible: false }));
      });

      graphRef.current = graph;

      return () => {
        graph.dispose();
      };
    }
  }, [currentFlow]);

  // 获取节点类型CSS类
  const getNodeTypeClass = (type: ApprovalNodeType): string => {
    const classMap = {
      [ApprovalNodeType.START]: "start-node",
      [ApprovalNodeType.APPROVER]: "approver-node",
      [ApprovalNodeType.EMAIL]: "email-node",
      [ApprovalNodeType.CONDITION]: "condition-node",
      [ApprovalNodeType.AUTO]: "auto-node",
      [ApprovalNodeType.PARALLEL]: "parallel-node",
      [ApprovalNodeType.END]: "end-node",
    };
    return classMap[type] || "approver-node";
  };

  // 获取节点图标
  const getNodeIcon = (type: ApprovalNodeType): string => {
    const iconMap = {
      [ApprovalNodeType.START]: "🚀",
      [ApprovalNodeType.APPROVER]: "👤",
      [ApprovalNodeType.EMAIL]: "📧",
      [ApprovalNodeType.CONDITION]: "⚙️",
      [ApprovalNodeType.AUTO]: "▶️",
      [ApprovalNodeType.PARALLEL]: "👥",
      [ApprovalNodeType.END]: "🏁",
    };
    return iconMap[type] || "👤";
  };

  // 添加节点
  const handleAddNode = () => {
    setEditingNode(undefined);
    setNodeEditVisible(true);
  };

  // 编辑节点
  const handleEditNode = () => {
    if (selectedNode && currentFlow) {
      const nodeData = currentFlow.nodes.find((n) => n.id === selectedNode.id);
      if (nodeData) {
        setEditingNode(nodeData);
        setNodeEditVisible(true);
      }
    }
  };

  // 删除节点
  const handleDeleteNode = () => {
    if (selectedNode && currentFlow && graphRef.current) {
      Modal.confirm({
        title: "确定要删除这个节点吗？",
        content: "删除节点将同时删除与该节点相关的所有连线",
        onOk: () => {
          // 删除相关的边
          const edgesToRemove = currentFlow.edges.filter(
            (edge) =>
              edge.source === selectedNode.id || edge.target === selectedNode.id
          );
          edgesToRemove.forEach((edge) => {
            if (graphRef.current) {
              graphRef.current.removeEdge(edge.id);
            }
          });

          // 删除节点
          if (graphRef.current) {
            graphRef.current.removeNode(selectedNode.id);
          }

          // 更新流程数据
          const updatedNodes = currentFlow.nodes.filter(
            (node) => node.id !== selectedNode.id
          );
          const updatedEdges = currentFlow.edges.filter(
            (edge) =>
              edge.source !== selectedNode.id && edge.target !== selectedNode.id
          );

          const updatedFlow = {
            ...currentFlow,
            nodes: updatedNodes,
            edges: updatedEdges,
            updatedAt: new Date().toISOString(),
          };

          setCurrentFlow(updatedFlow);
          const updatedFlows = flows.map((flow) =>
            flow.id === updatedFlow.id ? updatedFlow : flow
          );
          saveFlows(updatedFlows);
          setSelectedNode(null);
          message.success("节点删除成功");
        },
      });
    }
  };

  // 根据节点ID删除节点
  const handleDeleteNodeById = (nodeId: string) => {
    if (currentFlow && graphRef.current) {
      // 删除相关的边
      const edgesToRemove = currentFlow.edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
      edgesToRemove.forEach((edge) => {
        if (graphRef.current) {
          graphRef.current.removeEdge(edge.id);
        }
      });

      // 删除节点
      if (graphRef.current) {
        graphRef.current.removeNode(nodeId);
      }

      // 更新流程数据
      const updatedNodes = currentFlow.nodes.filter(
        (node) => node.id !== nodeId
      );
      const updatedEdges = currentFlow.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      const updatedFlow = {
        ...currentFlow,
        nodes: updatedNodes,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };

      setCurrentFlow(updatedFlow);
      const updatedFlows = flows.map((flow) =>
        flow.id === updatedFlow.id ? updatedFlow : flow
      );
      saveFlows(updatedFlows);
      setSelectedNode(null);
      message.success("节点删除成功");
    }
  };

  // 保存节点
  const handleSaveNode = (node: ApprovalNode) => {
    if (currentFlow && graphRef.current) {
      let updatedNodes;
      let updatedFlow;

      if (editingNode) {
        // 编辑现有节点
        updatedNodes = currentFlow.nodes.map((n) =>
          n.id === node.id ? node : n
        );

        // 更新图形中的节点
        const graphNode = graphRef.current.getCellById(node.id) as Node;
        if (graphNode) {
          const icon = getNodeIcon(node.type);
          graphNode.setAttrByPath("label/text", `${icon} ${node.name}`);
          graphNode.setData(node);
        }
      } else {
        // 添加新节点
        const newNode = {
          ...node,
          position: { x: 100, y: 100 + currentFlow.nodes.length * 120 },
        };
        updatedNodes = [...currentFlow.nodes, newNode];

        // 在图形中添加新节点
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

        graphRef.current.addNode({
          id: newNode.id,
          shape: "rect",
          x: newNode.position.x,
          y: newNode.position.y,
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
      }

      updatedFlow = {
        ...currentFlow,
        nodes: updatedNodes,
        updatedAt: new Date().toISOString(),
      };

      setCurrentFlow(updatedFlow);
      const updatedFlows = flows.map((flow) =>
        flow.id === updatedFlow.id ? updatedFlow : flow
      );
      saveFlows(updatedFlows);
      setNodeEditVisible(false);
      setEditingNode(undefined);

      // 清除节点选中状态
      if (graphRef.current) {
        graphRef.current.getNodes().forEach((n) => {
          n.setAttrByPath("body/stroke", "#d9d9d9");
          n.setAttrByPath("body/strokeWidth", 1);
        });
      }
      setSelectedNode(null);

      message.success(editingNode ? "节点更新成功" : "节点添加成功");
    }
  };

  // 创建新流程
  const handleCreateFlow = () => {
    const newFlow: ApprovalFlow = {
      id: `flow_${Date.now()}`,
      name: "新审批流程",
      description: "",
      nodes: [],
      edges: [],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 直接保存新流程到列表
    const updatedFlows = [...flows, newFlow];
    saveFlows(updatedFlows);
    setCurrentFlow(newFlow);
    message.success("流程创建成功");
  };

  // 编辑流程
  const handleEditFlow = (flow: ApprovalFlow) => {
    setEditingFlow(flow);
    setFlowEditVisible(true);
  };

  // 保存流程
  const handleSaveFlow = (flow: ApprovalFlow) => {
    let updatedFlows;
    if (editingFlow) {
      // 编辑现有流程
      updatedFlows = flows.map((f) => (f.id === flow.id ? flow : f));
    } else {
      // 添加新流程
      updatedFlows = [...flows, flow];
    }
    saveFlows(updatedFlows);
    setFlowEditVisible(false);
    setEditingFlow(null);
    setCurrentFlow(flow);
    message.success(editingFlow ? "流程更新成功" : "流程创建成功");
  };

  // 删除连线
  const handleDeleteEdge = () => {
    if (selectedEdge && currentFlow && graphRef.current) {
      Modal.confirm({
        title: "确定要删除这个连线吗？",
        content: "删除连线将断开节点之间的连接",
        onOk: () => {
          graphRef.current?.removeEdge(selectedEdge.id);
          setSelectedEdge(null);
          message.success("连线删除成功");
        },
      });
    }
  };

  // 右键菜单删除节点
  const handleContextDelete = () => {
    if (contextMenu.nodeId) {
      handleDeleteNodeById(contextMenu.nodeId);
      setContextMenu((m) => ({ ...m, visible: false }));
    }
  };

  return (
    <div className="approval-flow-editor">
      <Card
        title="审批流程编排"
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="请选择流程"
              value={currentFlow?.id}
              onChange={(value) => {
                const selectedFlow = flows.find((flow) => flow.id === value);
                if (selectedFlow) {
                  setCurrentFlow(selectedFlow);
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
                        handleCreateFlow();
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
                          handleEditFlow(flow);
                        }}
                        style={{ padding: 0, height: "auto" }}
                      />
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadFlows}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateFlow}
            >
              新建流程
            </Button>
          </Space>
        }
      >
        <div className="flow-container">
          {/* 流程编辑区域 */}
          <div className="flow-editor" style={{ width: "100%" }}>
            {currentFlow ? (
              <>
                <div className="flow-header">
                  <h3>{currentFlow.name}</h3>
                  <Space>
                    <Button icon={<PlusOutlined />} onClick={handleAddNode}>
                      添加节点
                    </Button>
                    <Button
                      icon={<DeleteOutlined />}
                      disabled={!selectedEdge}
                      danger
                      onClick={handleDeleteEdge}
                    >
                      删除连线
                    </Button>
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
        </div>
      </Card>

      {/* 节点编辑弹窗 */}
      <NodeEditModal
        visible={nodeEditVisible}
        node={editingNode}
        onCancel={() => {
          setNodeEditVisible(false);
          setEditingNode(undefined);

          // 清除节点选中状态
          if (graphRef.current) {
            graphRef.current.getNodes().forEach((n) => {
              n.setAttrByPath("body/stroke", "#d9d9d9");
              n.setAttrByPath("body/strokeWidth", 1);
            });
          }
          setSelectedNode(null);
        }}
        onOk={handleSaveNode}
      />

      {/* 流程编辑弹窗 */}
      <Modal
        title={editingFlow ? "编辑流程" : "新建流程"}
        open={flowEditVisible}
        onCancel={() => {
          setFlowEditVisible(false);
          setEditingFlow(null);
        }}
        onOk={() => {
          if (editingFlow) {
            handleSaveFlow(editingFlow);
          }
        }}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item
            label="流程名称"
            rules={[{ required: true, message: "请输入流程名称" }]}
          >
            <Input
              value={editingFlow?.name}
              onChange={(e) =>
                setEditingFlow(
                  editingFlow ? { ...editingFlow, name: e.target.value } : null
                )
              }
              placeholder="请输入流程名称"
            />
          </Form.Item>
          <Form.Item label="流程描述">
            <TextArea
              value={editingFlow?.description}
              onChange={(e) =>
                setEditingFlow(
                  editingFlow
                    ? { ...editingFlow, description: e.target.value }
                    : null
                )
              }
              rows={3}
              placeholder="请输入流程描述"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            minWidth: 100,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{ padding: "8px 16px", color: "#ff4d4f", cursor: "pointer" }}
            onClick={handleContextDelete}
          >
            删除节点
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalFlowEditor;
