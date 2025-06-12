/**
 * @file 邮件记录列表组件
 */
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Card, List, Tag, Button, Popconfirm, message, Empty } from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { indexedDBUtil, EmailRecord, EmailStatus } from "@/utils/indexedDB";
import dayjs from "dayjs";

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

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await indexedDBUtil.getAllEmailRecords();
      // 按发送时间倒序排序
      setRecords(
        data.sort(
          (a, b) => dayjs(b.sendTime).valueOf() - dayjs(a.sendTime).valueOf()
        )
      );
    } catch (error) {
      message.error("获取邮件记录失败");
    } finally {
      setLoading(false);
    }
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
    <Card title="邮件发送记录">
      <List
        loading={loading}
        dataSource={records}
        locale={{ emptyText: <Empty description="暂无邮件记录" /> }}
        renderItem={(record) => {
          const statusConfig = getStatusConfig(record.status);
          return (
            <List.Item
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{record.subject}</span>
                    <Tag color={statusConfig?.color}>
                      {statusConfig?.icon}
                      {statusConfig?.text}
                    </Tag>
                    <Tag
                      color={
                        record.emailType === "即时邮件" ? "blue" : "orange"
                      }
                    >
                      {record.emailType}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>
                      发送时间：
                      {dayjs(record.sendTime).format("YYYY-MM-DD HH:mm:ss")}
                    </div>
                    <div>收件人：{record.recipients}</div>
                    <div>发送人：{record.sender}</div>
                    <div style={{ marginTop: 8 }}>内容：{record.content}</div>
                  </div>
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
