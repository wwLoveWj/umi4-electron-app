import { ApprovalNodeType, ApprovalModule } from "./types";

/**
 * 获取模块名称
 */
export const getModuleName = (module: ApprovalModule): string => {
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
export const getNodeTypeName = (type: ApprovalNodeType): string => {
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
export const getNodeHeaderBackground = (type: ApprovalNodeType): string => {
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
 * 获取节点类型CSS类
 */
export const getNodeTypeClass = (type: ApprovalNodeType): string => {
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

/**
 * 获取节点图标
 */
export const getNodeIcon = (type: ApprovalNodeType): string => {
  const iconMap = {
    [ApprovalNodeType.START]: "🚀",
    [ApprovalNodeType.APPROVER]: "👤",
    [ApprovalNodeType.CONDITION]: "🔀",
    [ApprovalNodeType.PARALLEL]: "⚡",
    [ApprovalNodeType.AUTO]: "🤖",
    [ApprovalNodeType.EMAIL]: "📧",
    [ApprovalNodeType.END]: "🏁",
  };
  return iconMap[type] || "👤";
};
