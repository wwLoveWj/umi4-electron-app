import React from "react";
import { Tabs } from "antd";
import MailSettings from "./components/MailSettings";
import BackgroundSettings from "./components/BackgroundSettings";
import ApprovalFlowEditor from "./components/approvalFlow";
import NodeModuleConfig from "./components/NodeModuleConfig";
import ScreenshotSettings from "./components/ScreenshotSettings";

export default function Index() {
  const items = [
    {
      key: "mail-config",
      label: "邮箱配置",
      children: <MailSettings />,
    },
    {
      key: "background-settings",
      label: "背景设置",
      children: <BackgroundSettings />,
    },
    {
      key: "approvalFlow-settings",
      label: "审批设置",
      children: <ApprovalFlowEditor />,
    },
    {
      key: "NodeModuleConfig",
      label: "节点属性",
      children: <NodeModuleConfig />,
    },
    {
      key: "screenshot-settings",
      label: "截图设置",
      children: <ScreenshotSettings />,
    },
  ];

  return <Tabs defaultActiveKey="mail-config" items={items} />;
}
