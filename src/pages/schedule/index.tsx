import React from "react";
import Cron from "qnn-react-cron";

export default ({ form, setOpen }: { form: any; setOpen: any }) => {
  const { getFieldValue, setFieldValue } = form;
  return (
    // @ts-ignore: 类型定义可能不正确，忽略此处的类型检查
    <Cron
      value={getFieldValue("cronValue")}
      onOk={(value: string) => {
        setFieldValue("cronValue", value);
        setOpen(false);
      }}
      // 配置面板的隐藏, false 即隐藏
      panesShow={{
        second: false,
        minute: true,
        hour: true,
        day: true,
        month: true,
        week: true,
        year: true,
      }}
      // 默认显示哪个面板, 默认为 second， 如果隐藏了 second 需要自行设置
      defaultTab={"minute"}
      // 原文链接：https://blog.csdn.net/qq_32682301/article/details/129593317
    />
  );
};
