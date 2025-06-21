import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Input } from "antd";
import styles from "./style.less";
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

  return <EmailRecordList ref={recordListRef} />;
}
