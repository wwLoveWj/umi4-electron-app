import React from "react";
import { Form } from "antd";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";

export default function MailSettings() {
  const [formRef] = Form.useForm();
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
      dataIndex: "address",
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
    <div
      style={{
        background: "#f9f9f9" /* 浅灰色背景 */,
        padding: "25px" /* 增加内边距 */,
        borderRadius: "10px" /* 圆角 */,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" /* 轻微阴影 */,
        // width: '100%', /* 宽度自适应 */
        // maxWidth: '800px', /* 最大宽度限制 */
        // margin: '0 auto', /* 居中显示 */
      }}
    >
      <WjForm
        form={formRef}
        formType="basic"
        noCard={true}
        layout="vertical"
        formConfigList={columns?.filter((item) => item?.search)}
      />
    </div>
  );
}
