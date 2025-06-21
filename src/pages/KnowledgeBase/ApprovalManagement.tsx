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
      fixed: "right",
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

export default ApprovalManagement;
