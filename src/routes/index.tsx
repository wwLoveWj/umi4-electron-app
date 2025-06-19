import {
  MailOutlined,
  PictureOutlined,
  CameraOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SendOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import React from "react";

export const routes: API.MenuRoutesType[] = [
  {
    path: "/",
    component: "@/layouts",
    layout: false,
    routes: [
      {
        path: "/",
        exact: true,
        hidden: true,
        redirect: "/home",
      },
      {
        path: "/home",
        component: "./home",
        title: "首页",
        icon: <AppstoreOutlined />,
      },
      {
        path: "/mail/send",
        component: "./mail",
        title: "邮箱设置",
        icon: <MailOutlined />,
      },
      {
        path: "/location",
        title: "位置监控",
        icon: <SendOutlined />,
        component: "./location",
      },
      {
        path: "/code",
        title: "代码工具",
        icon: <ToolOutlined />,
        component: "./treeUtils",
      },
      {
        path: "/knowledge",
        title: "知识库",
        icon: <ToolOutlined />,
        component: "./KnowledgeBase/index",
      },
      {
        key: "images-operate",
        title: "图片处理",
        path: "/pictures/processing",
        component: "./pictures",
        icon: <PictureOutlined />,
      },
      {
        key: "view-image",
        title: "图片查看",
        path: "/album/view-image",
        component: "./screenshot/ViewImage",
        icon: <PictureOutlined />,
        hidden: true,
      },
      {
        key: "screenshot",
        title: "截图",
        path: "/album/screenshot",
        component: "./screenshot/ScreenShot",
        icon: <CameraOutlined />,
        hidden: true,
      },
      {
        key: "settings",
        title: "系统配置",
        path: "/settings",
        component: "./setting",
        icon: <SettingOutlined />,
      },
    ],
  },
];
