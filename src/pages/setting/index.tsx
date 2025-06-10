import React from "react";
import { Tabs } from "antd";
import MailSettings from "./components/MailSettings";

export default function Index() {
  const items = [
    {
      key: "mail-config",
      label: "邮箱配置",
      children: <MailSettings />,
    },
    // 您可以在这里添加更多配置模块
    // {
    //   key: 'general-settings',
    //   label: '通用设置',
    //   children: <div>通用设置内容</div>,
    // },
  ];

  return <Tabs defaultActiveKey="mail-config" items={items} />;
}
