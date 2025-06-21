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
  Pagination,
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
  StopOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { indexedDBUtil, EmailRecord, EmailStatus } from "@/utils/indexedDB";
import dayjs from "dayjs";

const { ipcRenderer } = window.require("electron");
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
    case EmailStatus.CANCELLED:
      return {
        color: "default",
        icon: <StopOutlined style={{ marginRight: 4 }} />,
        text: "已取消",
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
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      // 重置到第一页
      setCurrentPage(1);
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
    } else {
      const filtered = records.filter((record) =>
        record.subject.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
    // 搜索时重置到第一页
    setCurrentPage(1);
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

      // 重新获取数据但不重置页码
      const data = await indexedDBUtil.getAllEmailRecords();
      const sortedData = data.sort(
        (a, b) => dayjs(b.sendTime).valueOf() - dayjs(a.sendTime).valueOf()
      );
      setRecords(sortedData);

      // 重新应用搜索过滤
      let newFilteredRecords;
      if (!searchText.trim()) {
        newFilteredRecords = sortedData;
      } else {
        newFilteredRecords = sortedData.filter((record) =>
          record.subject.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      setFilteredRecords(newFilteredRecords);

      // 检查当前页是否还有数据，如果没有则跳转到上一页
      const totalPages = Math.ceil(newFilteredRecords.length / pageSize);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 取消定时邮件
  const handleCancelSchedule = async (taskId: string) => {
    if (!taskId) {
      message.error("任务ID不存在");
      return;
    }

    ipcRenderer.send("ss:schedule-cancel", { taskId });

    // 监听一次性的取消结果
    ipcRenderer.once(
      "ss:schedule-cancel-reply",
      async (
        _: Electron.IpcRendererEvent,
        result: { taskId: string; status: string; error?: string }
      ) => {
        if (result.status === "success") {
          try {
            await indexedDBUtil.updateEmailRecordByTaskId(taskId, {
              status: EmailStatus.CANCELLED,
            });
            message.success("任务取消");

            // 重新获取数据但不重置页码
            const data = await indexedDBUtil.getAllEmailRecords();
            const sortedData = data.sort(
              (a, b) =>
                dayjs(b.sendTime).valueOf() - dayjs(a.sendTime).valueOf()
            );
            setRecords(sortedData);

            // 重新应用搜索过滤
            let newFilteredRecords;
            if (!searchText.trim()) {
              newFilteredRecords = sortedData;
            } else {
              newFilteredRecords = sortedData.filter((record) =>
                record.subject.toLowerCase().includes(searchText.toLowerCase())
              );
            }
            setFilteredRecords(newFilteredRecords);

            // 检查当前页是否还有数据，如果没有则跳转到上一页
            const totalPages = Math.ceil(newFilteredRecords.length / pageSize);
            if (currentPage > totalPages && totalPages > 0) {
              setCurrentPage(totalPages);
            }
          } catch (error) {
            console.error("更新数据库失败:", error);
            message.error(
              `取消失败: ${error instanceof Error ? error.message : "数据库更新失败"}`
            );
          }
        } else {
          message.error(`取消失败: ${result.error || "未知错误"}`);
        }
      }
    );
  };

  // 分页处理
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  // 计算当前页的数据
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRecords.slice(startIndex, endIndex);
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
      bodyStyle={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 200px)",
      }}
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <List
          loading={loading}
          dataSource={getCurrentPageData()}
          locale={{
            emptyText: (
              <Empty
                description={searchText ? "未找到相关邮件" : "暂无邮件记录"}
              />
            ),
          }}
          style={{
            flex: 1,
            overflowY: "auto",
          }}
          renderItem={(record) => {
            const statusConfig = getStatusConfig(record.status);
            const isScheduledEmail = record.emailType === "定时邮件";
            const canCancel =
              isScheduledEmail &&
              record.status === EmailStatus.PENDING &&
              record.taskId;

            const actions = [];

            // 只有定时邮件且状态为 PENDING 时才显示取消按钮
            if (canCancel) {
              actions.push(
                <Popconfirm
                  title="确定要取消这个定时邮件任务吗？"
                  onConfirm={() => handleCancelSchedule(record.taskId!)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<CloseOutlined />}>
                    取消发送
                  </Button>
                </Popconfirm>
              );
            }

            // 删除按钮
            actions.push(
              <Popconfirm
                title="确定要删除这条记录吗？"
                onConfirm={() => handleDelete(record.id!)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            );

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
                actions={actions}
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
                              record.emailType === "即时邮件"
                                ? "blue"
                                : "orange"
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
                            {dayjs(record.sendTime).format(
                              "YYYY-MM-DD HH:mm:ss"
                            )}
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

        {/* 固定在底部的分页器 */}
        <div
          style={{
            padding: "16px 0 0 0",
            borderTop: "1px solid #f0f0f0",
            backgroundColor: "#fff",
            textAlign: "center",
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredRecords.length}
            showSizeChanger={true}
            showQuickJumper={true}
            showTotal={(total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            pageSizeOptions={["5", "10", "20", "50"]}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
      </div>
    </Card>
  );
});

export default EmailRecordList;
