import React, { useState, useRef } from "react";
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

export default function Index() {
  const [open, setOpen] = useState(false);
  const recordListRef = useRef<EmailRecordListRef>(null);

  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    ipcRenderer.send("ss:schedule-cancel", { taskId: value });
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
