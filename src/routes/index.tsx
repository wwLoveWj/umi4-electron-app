import {
  MailOutlined,
  PictureOutlined,
  CameraOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SendOutlined,
  ToolOutlined,
  ReadOutlined,
  FormatPainterOutlined,
  CustomerServiceOutlined,
  CompassOutlined,
  DatabaseOutlined,
  TagsOutlined
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
        redirect: "/login",
      },
      {
        path: "/login",
        component: "./login",
        title: "登录",
        hidden: true,
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
        icon: <CompassOutlined />,
        component: "./location",
        hidden: true,
      },
      {
        path: "/music",
        title: "音乐播放器",
        icon: <CustomerServiceOutlined />,
        component: "./musicPlayer",
      },
      {
        path: "/code",
        title: "代码工具",
        icon: <FormatPainterOutlined />,
        component: "./treeUtils",
      },
      {
        path: "/knowledge",
        title: "知识库",
        icon: <ReadOutlined />,
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
        key: "data-process",
        title: "数据处理",
        path: "/data-process",
        component: "./dataProcess",
        icon: <DatabaseOutlined />,
      },
      {
        key: "settings",
        title: "系统配置",
        path: "/settings",
        component: "./setting",
        icon: <SettingOutlined />,
      },
      {
        key: "bookmarkManager",
        title: "网页收藏",
        path: "/bookmarkManager",
        component: "./bookmarkManager",
        icon: <TagsOutlined />,
      },
    ],
  },
];
