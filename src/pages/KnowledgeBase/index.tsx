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
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { knowledgeDBService, KnowledgeItem } from "@/services/knowledgeDB";
import KnowledgeModal from "./KnowledgeModal";
import "./style.less";

const { Search } = Input;
const { Option } = Select;

const KnowledgeBase: React.FC = () => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);

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
  }, [searchKey, category, tag]);

  // 新增/编辑弹窗确认
  const handleModalOk = async (item: KnowledgeItem) => {
    try {
      if (editItem) {
        await knowledgeDBService.updateItem(item);
        message.success("更新成功");
      } else {
        await knowledgeDBService.addItem(item);
        message.success("添加成功");
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
      width: 320,
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
      width: 160,
      render: (tags: string[]) => tags.map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
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

  return (
    <Card
      title="知识库管理"
      extra={
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
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 800 }}
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
};

export default KnowledgeBase;
