import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Input } from "antd";
import styles from "./style.less";
import EmailSendDrawer from "./components/EmailSendDrawer";
import type { GetProps } from "antd";
import EmailRecordList, {
  EmailRecordListRef,
} from "./components/EmailRecordList";
const { ipcRenderer } = window.require("electron");
type SearchProps = GetProps<typeof Input.Search>;
const { Search } = Input;
import { message } from "antd";
import { indexedDBUtil, EmailStatus } from "@/utils/indexedDB";

export default function Index() {
  const [open, setOpen] = useState(false);
  const recordListRef = useRef<EmailRecordListRef>(null);

  // 监听定时邮件执行完成事件
  useEffect(() => {
    const handleScheduleEmailExecuted = async (
      _: Electron.IpcRendererEvent,
      result: {
        taskId: string;
        status: string;
        error?: string;
        emailType: string;
      }
    ) => {
      try {
        await indexedDBUtil.updateEmailRecordByTaskId(result.taskId, {
          status:
            result.status === "success"
              ? EmailStatus.SUCCESS
              : EmailStatus.FAILED,
          sendTime: new Date().toISOString(),
        });

        if (result.status === "success") {
          message.success("定时邮件发送成功");
        } else {
          message.error(`定时邮件发送失败: ${result.error}`);
        }

        // 刷新邮件记录列表
        recordListRef.current?.refresh();
      } catch (error) {
        console.error("更新定时邮件状态失败:", error);
      }
    };

    ipcRenderer.on("ss:schedule-email-executed", handleScheduleEmailExecuted);

    return () => {
      ipcRenderer.removeListener(
        "ss:schedule-email-executed",
        handleScheduleEmailExecuted
      );
    };
  }, []);

  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    if (!value) return;
    ipcRenderer.send("ss:schedule-cancel", { taskId: value });

    // 监听一次性的取消结果
    ipcRenderer.once(
      "ss:schedule-cancel-reply",
      async (
        _: Electron.IpcRendererEvent,
        result: { taskId: string; status: string; error?: string }
      ) => {
        if (result.status === "success") {
          try {
            await indexedDBUtil.updateEmailRecordByTaskId(value, {
              status: EmailStatus.CANCELLED,
            });
            message.success("任务取消");
            recordListRef.current?.refresh();
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

  return (
    <>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        <Search
          placeholder="输入任务ID可取消定时邮件"
          onSearch={onSearch}
          style={{ flex: 1, marginRight: 16 }}
        />
        <Button type="primary" onClick={() => setOpen(true)}>
          发送邮件
        </Button>
      </div>

      <EmailRecordList ref={recordListRef} />

      <EmailSendDrawer
        value={open}
        onChange={setOpen}
        onSuccess={() => recordListRef.current?.refresh()}
      />
    </>
  );
}
