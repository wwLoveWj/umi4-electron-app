import { useState, useEffect } from "react";
import { ApprovalFlow } from "../types";

/**
 * 流程存储钩子
 */
export const useFlowStorage = () => {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<ApprovalFlow | null>(null);

  // 从localStorage加载流程数据
  useEffect(() => {
    const savedFlows = localStorage.getItem("approvalFlows");
    if (savedFlows) {
      try {
        const parsedFlows = JSON.parse(savedFlows);
        setFlows(parsedFlows);
        if (parsedFlows.length > 0) {
          setCurrentFlow(parsedFlows[0]);
        }
      } catch (error) {
        console.error("加载流程数据失败:", error);
      }
    } else {
      // 初始化示例数据
      const initialFlows: ApprovalFlow[] = [
        {
          id: "flow_1",
          name: "知识库审批流程",
          description: "知识库内容的审批流程",
          nodes: [
            {
              id: "start_1",
              name: "发起人",
              type: "start" as any,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 100 },
            },
            {
              id: "approver_1",
              name: "部门经理审批",
              type: "approver" as any,
              module: "knowledge_base" as any,
              approvers: ["张三", "李四"],
              requiredApprovers: ["张三"],
              isRequired: true,
              position: { x: 100, y: 250 },
            },
            {
              id: "email_1",
              name: "邮件催办",
              type: "email" as any,
              approvers: [],
              requiredApprovers: [],
              emailRecipients: ["manager@company.com"],
              emailSubject: "请及时审批知识库内容",
              isRequired: false,
              position: { x: 100, y: 400 },
            },
            {
              id: "end_1",
              name: "结束",
              type: "end" as any,
              approvers: [],
              requiredApprovers: [],
              isRequired: false,
              position: { x: 100, y: 550 },
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
              target: "email_1",
            },
            {
              id: "edge_3",
              source: "email_1",
              target: "end_1",
            },
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setFlows(initialFlows);
      setCurrentFlow(initialFlows[0]);
      localStorage.setItem("approvalFlows", JSON.stringify(initialFlows));
    }
  }, []);

  // 保存流程数据到localStorage
  const saveFlows = (newFlows: ApprovalFlow[]) => {
    setFlows(newFlows);
    localStorage.setItem("approvalFlows", JSON.stringify(newFlows));
  };

  // 更新当前流程
  const updateCurrentFlow = (updatedFlow: ApprovalFlow) => {
    const newFlows = flows.map((flow) =>
      flow.id === updatedFlow.id ? updatedFlow : flow
    );
    saveFlows(newFlows);
    setCurrentFlow(updatedFlow);
  };

  // 添加新流程
  const addFlow = (newFlow: ApprovalFlow) => {
    const newFlows = [...flows, newFlow];
    saveFlows(newFlows);
    setCurrentFlow(newFlow);
  };

  // 删除流程
  const deleteFlow = (flowId: string) => {
    const newFlows = flows.filter((flow) => flow.id !== flowId);
    saveFlows(newFlows);
    if (currentFlow?.id === flowId) {
      setCurrentFlow(newFlows.length > 0 ? newFlows[0] : null);
    }
  };

  return {
    flows,
    currentFlow,
    setCurrentFlow,
    updateCurrentFlow,
    addFlow,
    deleteFlow,
  };
};
