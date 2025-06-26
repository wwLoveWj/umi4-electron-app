import "@/styles/reset.less"; // 重置HTML样式
import "./global.less";

import { ConfigProvider } from "antd";
import Package from "../package.json";
import React from "react";
import zhCN from "antd/es/locale/zh_CN";

import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
dayjs.locale("zh-cn");
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function rootContainer(container: React.ReactNode) {
  ConfigProvider.config({
    prefixCls: Package.name + "-ant",
  });
  return (
    <ConfigProvider prefixCls={Package.name + "-ant"} locale={zhCN}>
      {container}
    </ConfigProvider>
  );
}

export async function render(oldRender: any) {
  oldRender();
}

/**
 * Umi4 路由切换时触发进度条动画
 * @param param0 路由切换参数
 */
export function onRouteChange({ location, routes, action, history }: any) {
  NProgress.start();
  // 500ms 后自动完成，防止页面太快一闪而过
  setTimeout(() => {
    NProgress.done();
  }, 500);
}
