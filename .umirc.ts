import { defineConfig } from "umi";
import { routes } from "./src/routes/index";

export default defineConfig({
  routes,
  npmClient: "yarn",
  mfsu: false, // 禁用 mfsu
  history: { type: "hash" },
  base: "/",
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
});
