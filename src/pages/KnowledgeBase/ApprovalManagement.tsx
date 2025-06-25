/**
 * @file 知识库审批管理页面
 * @description 管理待审批的知识库条目，支持审批通过/拒绝操作
 */
import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Input,
  Tag,
  Table,
  Space,
  Modal,
  message,
  Tooltip,
  Form,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  knowledgeDBService,
  KnowledgeItem,
  ApprovalStatus,
} from "@/services/knowledgeDB";
import dayjs from "dayjs";
import {
  ApprovalFlow,
  ApprovalNode,
} from "@/pages/setting/components/approvalFlow/components/types";

const { Search } = Input;
const { TextArea } = Input;

interface ApprovalManagementProps {
  onDataChange?: () => void; // 添加数据变化回调
}

const ApprovalManagement: React.FC<ApprovalManagementProps> = ({
  onDataChange,
}) => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);
  const [approvalForm] = Form.useForm();
  const [isRejecting, setIsRejecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());

  // 加载待审批数据
  const loadPendingData = async () => {
    setLoading(true);
    try {
      let items: KnowledgeItem[] = await knowledgeDBService.getPendingItems();

      // 前端搜索过滤
      if (searchKey) {
        const kw = searchKey.trim().toLowerCase();
        items = items.filter(
          (item) =>
            item.question.toLowerCase().includes(kw) ||
            item.answer.toLowerCase().includes(kw) ||
            item.category.toLowerCase().includes(kw) ||
            item.tags.some((tag) => tag.toLowerCase().includes(kw))
        );
      }

      setData(items);

      // 数据加载完成后通知父组件
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      message.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadPendingData();
  }, []); // 只在组件挂载时执行一次

  // 搜索关键词变化时重新加载数据
  useEffect(() => {
    loadPendingData();
  }, [searchKey]);

  // refreshKey变化时重新加载数据（用于强制刷新）
  useEffect(() => {
    loadPendingData();
  }, [refreshKey]);

  // 审批操作
  const handleApproval = async (approved: boolean) => {
    if (!currentItem) return;

    try {
      setIsRejecting(!approved);

      // 如果是拒绝操作，先验证拒绝原因
      if (!approved) {
        const rejectReason = approvalForm.getFieldValue("rejectReason");
        if (!rejectReason || rejectReason.trim() === "") {
          message.error("拒绝时必须填写拒绝原因");
          return;
        }
      }

      const values = await approvalForm.validateFields();
      const rejectReason = approved ? undefined : values.rejectReason;

      await knowledgeDBService.approveItem(
        currentItem.id,
        "当前用户", // 这里可以根据实际登录用户获取
        rejectReason
      );

      message.success(approved ? "审批通过成功" : "审批拒绝成功");
      setApprovalModalVisible(false);
      setCurrentItem(null);
      setIsRejecting(false);
      approvalForm.resetFields();
      loadPendingData();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      message.error("审批操作失败");
    }
  };

  // 查看详情
  const handleViewDetail = (item: KnowledgeItem) => {
    setCurrentItem(item);
    setApprovalModalVisible(true);
  };

  // 表格列
  const columns = [
    {
      title: "问题",
      dataIndex: "question",
      key: "question",
      ellipsis: { showTitle: false },
      width: 250,
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "答案",
      dataIndex: "answer",
      key: "answer",
      ellipsis: { showTitle: false },
      width: 300,
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          <span style={{ color: "#888" }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 150,
      render: (tags: string[]) => tags.map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: "提交人",
      dataIndex: "submittedBy",
      key: "submittedBy",
      width: 100,
      render: (submittedBy: string) => submittedBy || "未知",
    },
    {
      title: "提交时间",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 150,
      render: (submittedAt: string) =>
        submittedAt ? dayjs(submittedAt).format("YYYY-MM-DD HH:mm") : "未知",
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_: any, item: KnowledgeItem) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => handleViewDetail(item)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // 统计信息
  const getStatistics = () => {
    const total = data.length;
    const today = dayjs().startOf("day");
    const todayCount = data.filter(
      (item) => item.submittedAt && dayjs(item.submittedAt).isAfter(today)
    ).length;

    return { total, todayCount };
  };

  const stats = getStatistics();

  // 获取审批流统计信息
  const getFlowStatistics = () => {
    try {
      const flowsStr = localStorage.getItem("approvalFlows");
      if (!flowsStr) return { flows: [], totalFlows: 0, activeFlows: 0 };

      const flows: ApprovalFlow[] = JSON.parse(flowsStr);
      const activeFlows = flows.filter((flow) => flow.isActive !== false);

      return {
        flows,
        totalFlows: flows.length,
        activeFlows: activeFlows.length,
      };
    } catch (error) {
      console.error("获取审批流统计失败:", error);
      return { flows: [], totalFlows: 0, activeFlows: 0 };
    }
  };

  // 获取审批过程统计
  const getApprovalProcessStats = () => {
    const flowStats = getFlowStatistics();
    const processStats = {
      totalItems: data.length,
      itemsWithFlow: data.filter((item) => item.flowId).length,
      itemsWithoutFlow: data.filter((item) => !item.flowId).length,
      flowDistribution: {} as Record<string, number>,
    };

    // 统计每个审批流的使用情况
    flowStats.flows.forEach((flow) => {
      const count = data.filter((item) => item.flowId === flow.id).length;
      if (count > 0) {
        processStats.flowDistribution[flow.name] = count;
      }
    });

    return processStats;
  };

  const flowStats = getFlowStatistics();
  const processStats = getApprovalProcessStats();

  return (
    <Card
      title="知识库审批管理"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadPendingData}
          loading={loading}
        >
          刷新
        </Button>
      }
      className="approval-management-card"
    >
      {/* 流程流转状态概览 */}
      <Card
        size="small"
        title="流程流转状态概览"
        style={{ marginBottom: 16 }}
        extra={
          <Button
            size="small"
            type="link"
            onClick={() => {
              // 这里可以跳转到审批流配置页面
              console.log("跳转到审批流配置");
            }}
          >
            配置审批流
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="审批流总数"
              value={flowStats.totalFlows}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="激活审批流"
              value={flowStats.activeFlows}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="使用审批流条目"
              value={processStats.itemsWithFlow}
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="未配置审批流条目"
              value={processStats.itemsWithoutFlow}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
        </Row>

        {/* 审批流使用情况 */}
        {Object.keys(processStats.flowDistribution).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#262626" }}>
              审批流使用分布：
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(processStats.flowDistribution).map(
                ([flowName, count]) => (
                  <Tag
                    key={flowName}
                    color="blue"
                    style={{
                      padding: "4px 12px",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {flowName}
                    <span
                      style={{
                        background: "#fff",
                        color: "#1890ff",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {count}
                    </span>
                  </Tag>
                )
              )}
            </div>
          </div>
        )}

        {/* 审批流配置预览 */}
        {flowStats.flows.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#262626" }}>
              审批流配置预览：
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                maxHeight: 120,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {flowStats.flows.map((flow) => {
                const isActive = flow.isActive !== false;
                const nodeCount = flow.nodes.filter(
                  (n) => n.type !== "end"
                ).length;
                const itemCount = processStats.flowDistribution[flow.name] || 0;

                return (
                  <Card
                    key={flow.id}
                    size="small"
                    style={{
                      minWidth: 200,
                      border: isActive
                        ? "1px solid #d9d9d9"
                        : "1px solid #ffccc7",
                      background: isActive ? "#fff" : "#fff2f0",
                    }}
                    bodyStyle={{ padding: "8px 12px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: isActive ? "#262626" : "#999",
                        }}
                      >
                        {flow.name}
                      </span>
                      <Tag color={isActive ? "green" : "red"}>
                        {isActive ? "激活" : "停用"}
                      </Tag>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#666",
                      }}
                    >
                      <span>节点数: {nodeCount}</span>
                      <span>使用: {itemCount}</span>
                    </div>
                    {/* 节点流程预览 */}
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "#999",
                      }}
                    >
                      {flow.nodes
                        .filter((n) => n.type !== "end")
                        .slice(0, 3)
                        .map((node, idx) => (
                          <span key={node.id}>
                            {node.name}
                            {idx <
                              Math.min(
                                3,
                                flow.nodes.filter((n) => n.type !== "end")
                                  .length - 1
                              ) && <span style={{ margin: "0 2px" }}>→</span>}
                          </span>
                        ))}
                      {flow.nodes.filter((n) => n.type !== "end").length >
                        3 && <span style={{ color: "#ccc" }}>...</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 无审批流配置提示 */}
        {flowStats.flows.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#999",
              background: "#fafafa",
              borderRadius: 6,
            }}
          >
            <div style={{ marginBottom: 8 }}>暂无审批流配置</div>
            <div style={{ fontSize: 12 }}>请先配置审批流以启用流程化审批</div>
          </div>
        )}
      </Card>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="待审批总数"
              value={stats.total}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="今日新增"
              value={stats.todayCount}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="审批状态"
              value="待审批"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索问题/答案/分类/标签"
          allowClear
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          pageSizeOptions: ["10", "20", "50"],
        }}
        scroll={{ x: 1200 }}
      />

      {/* 审批详情弹窗 */}
      <Modal
        title="知识条目详情"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setCurrentItem(null);
          setIsRejecting(false);
          approvalForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setApprovalModalVisible(false);
              setCurrentItem(null);
              setIsRejecting(false);
              approvalForm.resetFields();
            }}
          >
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleApproval(false)}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApproval(true)}
          >
            通过
          </Button>,
        ]}
        width={800}
      >
        {currentItem && (
          <div>
            {/* 审批流进度展示 */}
            <ApprovalFlowProgress item={currentItem} />
            <Form form={approvalForm} layout="vertical">
              <Form.Item label="问题" style={{ marginBottom: 8 }}>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f5f5f5",
                    borderRadius: "6px",
                    minHeight: "32px",
                  }}
                >
                  {currentItem.question}
                </div>
              </Form.Item>

              <Form.Item label="答案" style={{ marginBottom: 8 }}>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f5f5f5",
                    borderRadius: "6px",
                    minHeight: "60px",
                  }}
                >
                  {currentItem.answer}
                </div>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="分类" style={{ marginBottom: 8 }}>
                    <Tag color="blue">{currentItem.category}</Tag>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="标签" style={{ marginBottom: 8 }}>
                    {currentItem.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="提交人" style={{ marginBottom: 8 }}>
                    {currentItem.submittedBy || "未知"}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="提交时间" style={{ marginBottom: 8 }}>
                    {currentItem.submittedAt
                      ? dayjs(currentItem.submittedAt).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )
                      : "未知"}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="rejectReason"
                label="拒绝原因"
                rules={[
                  {
                    required: isRejecting,
                    message: "拒绝时必须填写拒绝原因",
                  },
                  {
                    validator: (_, value) => {
                      if (isRejecting && (!value || value.trim() === "")) {
                        return Promise.reject(
                          new Error("拒绝时必须填写拒绝原因")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <TextArea rows={3} placeholder="请输入拒绝原因（拒绝时必填）" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
};

/**
 * 审批流进度条组件
 * @param {{ item: KnowledgeItem }}
 */
const ApprovalFlowProgress: React.FC<{ item: KnowledgeItem }> = ({ item }) => {
  console.log("ApprovalFlowProgress item:", item);
  console.log("item.flowId:", item.flowId);
  console.log("item.currentNodeId:", item.currentNodeId);
  console.log("item.nodeHistory:", item.nodeHistory);

  if (!item.flowId) {
    console.log("No flowId, returning null");
    return <div style={{ marginBottom: 24, color: "#999" }}>未配置审批流</div>;
  }

  // 获取审批流
  const flowsStr = localStorage.getItem("approvalFlows");
  console.log("flowsStr:", flowsStr);
  if (!flowsStr) {
    console.log("No flows in localStorage");
    return (
      <div style={{ marginBottom: 24, color: "#999" }}>未找到审批流配置</div>
    );
  }

  const flows: ApprovalFlow[] = JSON.parse(flowsStr);
  console.log("flows:", flows);
  const flow = flows.find((f) => f.id === item.flowId);
  console.log("found flow:", flow);

  if (!flow) {
    console.log("Flow not found");
    return (
      <div style={{ marginBottom: 24, color: "#999" }}>审批流配置不存在</div>
    );
  }

  // 节点历史
  const nodeHistory: string[] = item.nodeHistory || [];
  // 当前节点
  const currentNodeId = item.currentNodeId;

  // 计算流转进度
  const allNodes = flow.nodes.filter((n) => n.type !== "end");
  const completedNodes = nodeHistory.length;
  const totalNodes = allNodes.length;
  const progressPercent =
    totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  // 获取当前节点信息
  const currentNode = flow.nodes.find((n) => n.id === currentNodeId);
  const currentNodeName = currentNode?.name || "未知节点";

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 流转进度标题 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16 }}>审批流进度</div>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>当前节点：</span>
          <span
            style={{
              color: "#1677ff",
              fontWeight: 600,
              background: "#e6f4ff",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {currentNodeName}
          </span>
          <span style={{ marginLeft: 16 }}>
            进度：{completedNodes}/{totalNodes} ({progressPercent.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: "#f0f0f0",
          borderRadius: 4,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #52c41a 0%, #73d13d 100%)",
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* 节点流程图 */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "16px",
          background: "#fafafa",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
        }}
      >
        {allNodes.map((node, idx) => {
          const isDone = nodeHistory.includes(node.id);
          const isCurrent = currentNodeId === node.id;
          const isPending = !isDone && !isCurrent;

          // 根据节点状态设置样式
          let nodeStyle: any = {
            minWidth: 120,
            padding: "8px 16px",
            borderRadius: 20,
            fontWeight: 500,
            fontSize: 14,
            textAlign: "center" as const,
            border: "2px solid",
            position: "relative" as const,
            transition: "all 0.3s ease",
          };

          if (isCurrent) {
            // 当前节点：蓝色高亮
            nodeStyle = {
              ...nodeStyle,
              background: "#e6f4ff",
              color: "#1677ff",
              borderColor: "#1677ff",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(22, 119, 255, 0.3)",
            };
          } else if (isDone) {
            // 已完成节点：绿色
            nodeStyle = {
              ...nodeStyle,
              background: "#f6ffed",
              color: "#389e0d",
              borderColor: "#b7eb8f",
              fontWeight: 600,
            };
          } else {
            // 未到达节点：灰色
            nodeStyle = {
              ...nodeStyle,
              background: "#f5f5f5",
              color: "#999",
              borderColor: "#d9d9d9",
              fontWeight: 400,
            };
          }

          return (
            <div
              key={node.id}
              style={{ display: "flex", alignItems: "center" }}
            >
              {/* 节点状态指示器 */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      background: "#1677ff",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ⚡
                  </div>
                )}
                {isDone && (
                  <div
                    style={{
                      background: "#52c41a",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✓
                  </div>
                )}
                {isPending && (
                  <div
                    style={{
                      background: "#d9d9d9",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ○
                  </div>
                )}
              </div>

              {/* 节点内容 */}
              <div style={nodeStyle}>
                {node.name}
                {isCurrent && (
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: "#1677ff",
                      fontWeight: 400,
                    }}
                  >
                    (当前)
                  </div>
                )}
                {isDone && !isCurrent && (
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: "#389e0d",
                      fontWeight: 400,
                    }}
                  >
                    (已完成)
                  </div>
                )}
                {isPending && (
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: "#999",
                      fontWeight: 400,
                    }}
                  >
                    (待处理)
                  </div>
                )}
              </div>

              {/* 连接箭头 */}
              {idx < allNodes.length - 1 && (
                <div
                  style={{
                    margin: "0 8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 2,
                      background: isDone ? "#52c41a" : "#d9d9d9",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: -4,
                        top: -3,
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid",
                        borderTop: "4px solid transparent",
                        borderBottom: "4px solid transparent",
                        borderLeftColor: isDone ? "#52c41a" : "#d9d9d9",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 流转详情 */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f8f9fa",
          borderRadius: 6,
          border: "1px solid #e9ecef",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#495057" }}>
          流转详情：
        </div>
        <div style={{ fontSize: 13, color: "#6c757d", lineHeight: 1.6 }}>
          {nodeHistory.length > 0 ? (
            <div>
              已通过节点：
              {nodeHistory.map((nodeId, index) => {
                const node = flow.nodes.find((n) => n.id === nodeId);
                return (
                  <span key={nodeId}>
                    {node?.name || nodeId}
                    {index < nodeHistory.length - 1 ? " → " : ""}
                  </span>
                );
              })}
            </div>
          ) : (
            <div>尚未开始审批流程</div>
          )}
          {currentNodeId && (
            <div style={{ marginTop: 4 }}>
              当前等待：
              <span style={{ color: "#1677ff", fontWeight: 600 }}>
                {currentNodeName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalManagement;
