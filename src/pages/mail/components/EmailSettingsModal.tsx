import React, { useState } from "react";
import { Button, Modal, Form } from "antd";
import { useControllableValue } from "ahooks";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";

const EmailSettingsModal: React.FC = (props) => {
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
      console.log(res, "kkjhg-------");
      ipcRenderer.send("ss:settings-email", res);
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
      dataIndex: "host",
      title: "服务器地址",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "number",
      dataIndex: "port",
      title: "服务器端口",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "switch",
      dataIndex: "secure",
      title: "启用TLS",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
      fieldProps: {
        checkedChildren: "开启",
        unCheckedChildren: "关闭",
        defaultChecked: true,
      },
    },
    {
      dataIndex: "user",
      title: "认证邮箱账户",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "password",
      dataIndex: "pass",
      title: "认证密码",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "mentions",
      search: true,
      dataIndex: "sendToWho",
      title: "发送者邮箱",
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
  ];
  return (
    <>
      <Modal
        open={open}
        title="邮件设置"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            确定
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

export default EmailSettingsModal;
