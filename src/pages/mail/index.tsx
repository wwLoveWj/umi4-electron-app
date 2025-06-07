import React, { useState } from "react";
import { Card, Button, Input } from "antd";
import styles from "./style.less";
import EmailSendDrawer from "./components/EmailSendDrawer";
import type { GetProps } from "antd";
const { ipcRenderer } = window.require("electron");
type SearchProps = GetProps<typeof Input.Search>;
const { Search } = Input;

export default function Index() {
  const [open, setOpen] = useState(false);
  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    debugger;
    ipcRenderer.send("ss:schedule-cancel", value);
  };

  return (
    <>
      <Button
        type="primary"
        style={{ marginBottom: "16px" }}
        onClick={() => setOpen(true)}
      >
        发送邮件
      </Button>
      <Search
        placeholder="取消定时任务，请输入jobId"
        allowClear
        onSearch={onSearch}
        style={{ width: 304, marginLeft: "12px" }}
      />
      <EmailSendDrawer value={open} onChange={setOpen} />
      <div className={styles?.container}>
        {Array(30)
          .fill(0)
          ?.map((item) => (
            <Card key={item}>yyds</Card>
          ))}
      </div>
    </>
  );
}
