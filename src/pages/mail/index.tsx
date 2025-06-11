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
    debugger;
    ipcRenderer.send("ss:schedule-cancel", value);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
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
    </div>
  );
}
