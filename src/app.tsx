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
