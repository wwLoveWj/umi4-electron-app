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
  selectedNodeId?: string; // 选中的节点ID
  selectedEdgeId?: string; // 选中的边ID
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
