/**
 * @file 知识库管理页面
 * @description 支持增删改查、搜索、分类、标签筛选（表格风格）
 */
import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Input,
  Tag,
  Select,
  Table,
  Space,
  Modal,
  message,
  Tooltip,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  AuditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  knowledgeDBService,
  KnowledgeItem,
  ApprovalStatus,
} from "@/services/knowledgeDB";
import KnowledgeModal from "./KnowledgeModal";
import ApprovalManagement from "./ApprovalManagement";
import "./style.less";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;

const KnowledgeBase: React.FC = () => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>(
    undefined
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("management");

  // 分类和标签集合
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    let items: KnowledgeItem[] = await knowledgeDBService.getAllItems();

    // 前端多条件过滤
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
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    if (tag) {
      items = items.filter((item) => item.tags.includes(tag));
    }
    if (approvalStatus) {
      items = items.filter((item) => item.approvalStatus === approvalStatus);
    }

    setData(items);
    setLoading(false);
    // 分类和标签去重收集
    setAllCategories(
      Array.from(new Set(items.map((i) => i.category).filter(Boolean)))
    );
    setAllTags(
      Array.from(new Set(items.flatMap((i) => i.tags).filter(Boolean)))
    );
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [searchKey, category, tag, approvalStatus]);

  // 新增/编辑弹窗确认
  const handleModalOk = async (item: KnowledgeItem) => {
    try {
      if (editItem) {
        // 检查是否是编辑已通过的知识条目
        const isEditingApprovedItem =
          editItem.approvalStatus === ApprovalStatus.APPROVED;

        const updatedItem = {
          ...item,
          // 如果编辑的是已通过的知识条目，自动重新发起审批
          approvalStatus: isEditingApprovedItem
            ? ApprovalStatus.PENDING
            : editItem.approvalStatus,
          submittedBy: isEditingApprovedItem
            ? "当前用户"
            : editItem.submittedBy,
          submittedAt: isEditingApprovedItem
            ? new Date().toISOString()
            : editItem.submittedAt,
          // 清除之前的审批信息
          approvedBy: isEditingApprovedItem ? undefined : editItem.approvedBy,
          approvedAt: isEditingApprovedItem ? undefined : editItem.approvedAt,
          rejectReason: isEditingApprovedItem
            ? undefined
            : editItem.rejectReason,
        };

        await knowledgeDBService.updateItem(updatedItem);
        message.success(
          isEditingApprovedItem ? "更新成功，已重新提交审批" : "更新成功"
        );
      } else {
        // 新增时设置为待审批状态
        const newItem = {
          ...item,
          approvalStatus: ApprovalStatus.PENDING,
          submittedBy: "当前用户", // 这里可以根据实际登录用户获取
          submittedAt: new Date().toISOString(),
        };
        await knowledgeDBService.addItem(newItem);
        message.success("添加成功，已提交审批");
      }
      setModalVisible(false);
      setEditItem(null);
      loadData();
    } catch (e) {
      message.error("保存失败");
    }
  };

  // 删除
  const handleDelete = (item: KnowledgeItem) => {
    Modal.confirm({
      title: `确定要删除该知识条目吗？`,
      content: item.question,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        await knowledgeDBService.deleteItem(item.id);
        message.success("删除成功");
        loadData();
      },
    });
  };

  // 提交审批
  const handleSubmitApproval = async (item: KnowledgeItem) => {
    try {
      const updatedItem = {
        ...item,
        approvalStatus: ApprovalStatus.PENDING,
        submittedBy: "当前用户",
        submittedAt: new Date().toISOString(),
      };
      await knowledgeDBService.updateItem(updatedItem);
      message.success("已提交审批");
      loadData();
    } catch (error) {
      message.error("提交审批失败");
    }
  };

  // 获取审批状态标签颜色
  const getApprovalStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return "orange";
      case ApprovalStatus.APPROVED:
        return "green";
      case ApprovalStatus.REJECTED:
        return "red";
      default:
        return "default";
    }
  };

  // 获取审批状态文本
  const getApprovalStatusText = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return "待审批";
      case ApprovalStatus.APPROVED:
        return "已通过";
      case ApprovalStatus.REJECTED:
        return "已拒绝";
      default:
        return "未知";
    }
  };

  // 表格列
  const columns = [
    {
      title: "问题",
      dataIndex: "question",
      key: "question",
      ellipsis: { showTitle: false },
      width: 220,
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
      width: 280,
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
      width: 140,
      render: (tags: string[]) => tags.map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: "审批状态",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      width: 100,
      render: (status: ApprovalStatus) => (
        <Tag color={getApprovalStatusColor(status)}>
          {getApprovalStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (updatedAt: string) =>
        updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm") : "未知",
    },
    {
      title: "审核人",
      dataIndex: "approvedBy",
      key: "approvedBy",
      width: 100,
      render: (approvedBy: string) => approvedBy || "未审核",
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_: any, item: KnowledgeItem) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => {
              setEditItem(item);
              setModalVisible(true);
            }}
          />
          {item.approvalStatus !== ApprovalStatus.PENDING && (
            <Tooltip
              title={
                item.approvalStatus === ApprovalStatus.APPROVED
                  ? "已通过的知识条目无需重新提交审批"
                  : "重新提交审批"
              }
            >
              <Button
                icon={<SendOutlined />}
                size="small"
                type="link"
                disabled={item.approvalStatus === ApprovalStatus.APPROVED}
                onClick={() => handleSubmitApproval(item)}
                title="提交审批"
              />
            </Tooltip>
          )}
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            type="link"
            onClick={() => handleDelete(item)}
          />
        </Space>
      ),
    },
  ];

  // 知识库管理内容
  const KnowledgeManagementContent = () => (
    <Card
      title="知识库管理"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditItem(null);
              setModalVisible(true);
            }}
          >
            新增知识
          </Button>
        </Space>
      }
      className="knowledge-base-card"
    >
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索问题/答案/分类/标签"
          allowClear
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          onSearch={setSearchKey}
          style={{ width: 250 }}
        />
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 150 }}
          value={category}
          onChange={setCategory}
        >
          {allCategories.map((cat) => (
            <Option key={cat} value={cat}>
              {cat}
            </Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="按标签筛选"
          style={{ width: 150 }}
          value={tag}
          onChange={setTag}
        >
          {allTags.map((tag) => (
            <Option key={tag} value={tag}>
              {tag}
            </Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="审批状态"
          style={{ width: 120 }}
          value={approvalStatus}
          onChange={setApprovalStatus}
        >
          <Option value={ApprovalStatus.PENDING}>待审批</Option>
          <Option value={ApprovalStatus.APPROVED}>已通过</Option>
          <Option value={ApprovalStatus.REJECTED}>已拒绝</Option>
        </Select>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 1000 }}
      />
      <KnowledgeModal
        visible={modalVisible}
        item={editItem}
        onCancel={() => {
          setModalVisible(false);
          setEditItem(null);
        }}
        onOk={handleModalOk}
        allCategories={allCategories}
        allTags={allTags}
      />
    </Card>
  );

  // 处理审批数据变化
  const handleApprovalDataChange = () => {
    // 如果当前在知识管理标签页，刷新数据
    if (activeTab === "management") {
      loadData();
    }
  };

  // 标签页配置
  const tabItems = [
    {
      key: "management",
      label: (
        <span>
          <EditOutlined />
          知识管理
        </span>
      ),
      children: <KnowledgeManagementContent />,
    },
    {
      key: "approval",
      label: (
        <span>
          <AuditOutlined />
          审批管理
        </span>
      ),
      children: (
        <ApprovalManagement
          key={`approval-management-${activeTab === "approval" ? Date.now() : "inactive"}`}
          onDataChange={handleApprovalDataChange}
        />
      ),
    },
  ];

  return (
    <Tabs
      defaultActiveKey="management"
      activeKey={activeTab}
      onChange={(key) => {
        setActiveTab(key);
        // 切换到审批管理时，通过key变化触发ApprovalManagement组件重新渲染
        if (key === "approval") {
          // 重置搜索条件，确保显示所有待审批数据
          setSearchKey("");
          setCategory(undefined);
          setTag(undefined);
          setApprovalStatus(undefined);
        } else if (key === "management") {
          // 切换到知识管理时，刷新数据
          loadData();
        }
      }}
      items={tabItems}
      size="large"
      style={{ background: "#fff", padding: "16px", borderRadius: "8px" }}
    />
  );
};

export default KnowledgeBase;
