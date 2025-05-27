import { defineConfig } from "umi";

export default defineConfig({
  routes: [
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
          layout: false,
        },
        {
          path: "/mail/send",
          component: "./mail",
          layout: false,
        },
        {
          key: "view-image",
          title: "图片查看",
          path: "/album/view-image",
          component: "./screenshot/ViewImage",
          layout: false,
        },
        {
          key: "screenshot",
          title: "截图",
          path: "/album/screenshot",
          component: "./screenshot/ScreenShot",
          layout: false,
        },
      ],
    },
  ],
  npmClient: "yarn",
  mfsu: false, // 禁用 mfsu
  history: { type: "hash" },
  base: "/",
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
});
