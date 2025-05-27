import React, { useState } from "react";
import { Card, Button } from "antd";
import styles from "./style.less";
import EmailSendDrawer from "./components/EmailSendDrawer";
// import EmailSettingsModal from "./components/EmailSettingsModal";
export default function Index() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="primary"
        style={{ marginBottom: "16px" }}
        onClick={() => setOpen(true)}
      >
        发送邮件
      </Button>
      <EmailSendDrawer value={open} onChange={setOpen} />
      <div className={styles?.container}>
        {Array(30)
          .fill(0)
          ?.map((item) => (
            <Card>yyds</Card>
          ))}
      </div>
    </>
  );
}
