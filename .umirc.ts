import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "./screenshot" },
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
  npmClient: "yarn",
  mfsu: false, // 禁用 mfsu
  history: { type: "hash" },
});
