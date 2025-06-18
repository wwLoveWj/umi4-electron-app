/**
 * @file 邮件记录列表组件
 */
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Card,
  List,
  Tag,
  Button,
  Popconfirm,
  message,
  Empty,
  Space,
  Typography,
  Input,
  Statistic,
} from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined as TimeIcon,
  SearchOutlined,
} from "@ant-design/icons";
import { indexedDBUtil, EmailRecord, EmailStatus } from "@/utils/indexedDB";
import dayjs from "dayjs";

const { Text } = Typography;
const { Search } = Input;

// 获取状态标签的配置
const getStatusConfig = (status: EmailStatus) => {
  switch (status) {
    case EmailStatus.SUCCESS:
      return {
        color: "success",
        icon: <CheckCircleOutlined style={{ marginRight: 4 }} />,
        text: "发送成功",
      };
    case EmailStatus.FAILED:
      return {
        color: "error",
        icon: <CloseCircleOutlined style={{ marginRight: 4 }} />,
        text: "发送失败",
      };
    case EmailStatus.PENDING:
      return {
        color: "warning",
        icon: <ClockCircleOutlined style={{ marginRight: 4 }} />,
        text: "未发送",
      };
  }
};

export interface EmailRecordListRef {
  refresh: () => Promise<void>;
}

const EmailRecordList = forwardRef<EmailRecordListRef>((_, ref) => {
  const [records, setRecords] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredRecords, setFilteredRecords] = useState<EmailRecord[]>([]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await indexedDBUtil.getAllEmailRecords();
      // 按发送时间倒序排序
      const sortedData = data.sort(
        (a, b) => dayjs(b.sendTime).valueOf() - dayjs(a.sendTime).valueOf()
      );
      setRecords(sortedData);
      setFilteredRecords(sortedData);
    } catch (error) {
      message.error("获取邮件记录失败");
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理函数
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredRecords(records);
      return;
    }
    const filtered = records.filter((record) =>
      record.subject.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRecords(filtered);
  };

  // 暴露刷新方法给父组件
  useImperativeHandle(ref, () => ({
    refresh: fetchRecords,
  }));

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await indexedDBUtil.deleteEmailRecord(id);
      message.success("删除成功");
      fetchRecords();
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <Card
      title={
        <Space>
          <span>邮件发送记录</span>
          <Statistic
            value={records.length}
            suffix="封"
            valueStyle={{ fontSize: "16px", color: "#1890ff" }}
          />
        </Space>
      }
      className="email-record-card"
      bodyStyle={{ padding: "16px" }}
      extra={
        <Search
          placeholder="搜索邮件主题"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "100%", maxWidth: "500px" }}
        />
      }
    >
      <List
        loading={loading}
        dataSource={filteredRecords}
        locale={{
          emptyText: (
            <Empty
              description={searchText ? "未找到相关邮件" : "暂无邮件记录"}
            />
          ),
        }}
        style={{
          maxHeight: "calc(100vh - 300px)",
          overflowY: "auto",
        }}
        renderItem={(record) => {
          const statusConfig = getStatusConfig(record.status);
          return (
            <List.Item
              key={record?.id}
              className="email-record-item"
              style={{
                background: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "12px",
                padding: "16px",
                transition: "all 0.3s",
                border: "1px solid transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                // e.currentTarget.style.border = "1px solid #52c41a";
                e.currentTarget.style.background = "#f6ffed";
              }}
              onMouseLeave={(e) => {
                // e.currentTarget.style.border = "1px solid transparent";
                e.currentTarget.style.background = "#f5f5f5";
              }}
              actions={[
                <Popconfirm
                  title="确定要删除这条记录吗？"
                  onConfirm={() => handleDelete(record.id!)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Text style={{ fontSize: "15px", color: "#262626" }}>
                        {record.subject}
                      </Text>
                      <Space>
                        <Tag
                          color={statusConfig?.color}
                          style={{ margin: 0, fontWeight: "normal" }}
                        >
                          {statusConfig?.icon}
                          {statusConfig?.text}
                        </Tag>
                        <Tag
                          color={
                            record.emailType === "即时邮件" ? "blue" : "orange"
                          }
                          style={{ margin: 0, fontWeight: "normal" }}
                        >
                          {record.emailType}
                        </Tag>
                      </Space>
                    </div>
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <TimeIcon
                          style={{ color: "#1890ff", fontSize: "14px" }}
                        />
                        <Text style={{ color: "#1890ff", fontSize: "14px" }}>
                          发送时间：
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          {dayjs(record.sendTime).format("YYYY-MM-DD HH:mm:ss")}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <MailOutlined
                          style={{ color: "#1890ff", fontSize: "14px" }}
                        />
                        <Text style={{ color: "#1890ff", fontSize: "14px" }}>
                          收件人：
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          {record.recipients}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <UserOutlined
                          style={{ color: "#1890ff", fontSize: "14px" }}
                        />
                        <Text style={{ color: "#1890ff", fontSize: "14px" }}>
                          发送人：
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          {record.sender}
                        </Text>
                      </div>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
});

export default EmailRecordList;
