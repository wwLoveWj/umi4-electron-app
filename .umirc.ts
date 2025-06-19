import { defineConfig } from "umi";
import { routes } from "./src/routes/index";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

export default defineConfig({
  routes,
  npmClient: "yarn",
  mfsu: false,
  history: { type: "hash" },
  base: "/",
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  externals: { require: "require" },
  chainWebpack(memo) {
    memo.module
      .rule("monaco-editor")
      .test(/\.worker\.(js|ts)$/)
      .use("worker-loader")
      .loader("worker-loader")
      .end();

    memo.plugin("monaco-editor").use(MonacoWebpackPlugin, [
      {
        languages: ["javascript", "typescript", "html", "css", "json", "yaml"],
        filename: "monaco-editor.[name].worker.js",
      },
    ]);
  },
});
