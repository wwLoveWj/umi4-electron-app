import React, { useState } from "react";
import { Button, Modal, Form } from "antd";
import { useControllableValue } from "ahooks";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";

const EmailSendDrawer: React.FC = (props) => {
  //   const [loading, setLoading] = useState(false);
  const [open, setOpen] = useControllableValue<boolean>(props);
  const [formRef] = Form.useForm();

  // 发送邮件
  const handleOk = () => {
    return formRef?.validateFields().then((res) => {
      const params = {
        ...res,
        sendToWho: res?.sendToWho?.replace(/\s*/g, ""), //去除所有空格
      };
      ipcRenderer.send("ss:send-email", params);
      setOpen(false);
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // 定时发送
  const handleRegulartimeSend = () => {
    ipcRenderer.send("ss:schedule-email");
    setOpen(false);
  };
  const columns: WjFormColumnsPropsType[] = [
    {
      valueType: "mentions",
      search: true,
      dataIndex: "sendToWho",
      title: "收件人邮箱",
      formItemProps: {
        rules: [{ required: true }],
      },
      fieldProps: {
        prefix: ["@"],
        options: ["163.com", "qq.com", "ww.com"].map((value) => ({
          key: value,
          value,
          label: value,
        })),
      },
    },
    {
      dataIndex: "title",
      title: "邮件主题",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "textarea",
      search: true,
      dataIndex: "content",
      title: "邮件内容",
    },
  ];
  return (
    <>
      <Modal
        open={open}
        title="邮件发送"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            发邮件
          </Button>,
          <Button
            key="fixed"
            type="primary"
            danger
            onClick={handleRegulartimeSend}
          >
            定时发送
          </Button>,
        ]}
      >
        <WjForm
          form={formRef}
          formType="basic"
          noCard={true}
          formConfigList={columns?.filter((item) => item?.search)}
        />
      </Modal>
    </>
  );
};

export default EmailSendDrawer;
