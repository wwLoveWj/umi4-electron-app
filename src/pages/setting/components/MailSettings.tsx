import React, { useEffect, useState } from "react";
import { Form, Button, message } from "antd";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";

export default function MailSettings() {
  const [formRef] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * 读取邮箱配置
   */
  const loadEmailSettings = async () => {
    try {
      setLoading(true);
      const result = await ipcRenderer.invoke("ss:get-email-settings");

      if (result.success && result.data) {
        // 设置表单初始值
        formRef.setFieldsValue(result.data);
        message.success("邮箱配置加载成功");
      } else if (result.success && !result.data) {
        message.info("未找到邮箱配置，请填写新的配置");
      } else {
        message.error(`加载配置失败: ${result.error}`);
      }
    } catch (error) {
      console.error("读取邮箱配置失败:", error);
      message.error("读取邮箱配置失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存邮箱配置
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await formRef.validateFields();
      ipcRenderer.send("ss:settings-email", values);
      message.success("邮箱配置保存成功");
    } catch (error) {
      console.error("保存邮箱配置失败:", error);
      message.error("保存邮箱配置失败");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 组件挂载时加载配置
   */
  useEffect(() => {
    loadEmailSettings();
  }, []);

  const columns: WjFormColumnsPropsType[] = [
    {
      dataIndex: "host",
      title: "服务器地址",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入服务器地址" }],
      },
    },
    {
      valueType: "number",
      dataIndex: "port",
      title: "服务器端口",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入服务器端口" }],
      },
    },
    {
      valueType: "switch",
      dataIndex: "secure",
      title: "启用TLS",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请选择是否启用TLS" }],
      },
      fieldProps: {
        checkedChildren: "开启",
        unCheckedChildren: "关闭",
        defaultChecked: true,
      },
    },
    {
      dataIndex: "user",
      title: "认证邮箱账户",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入认证邮箱账户" }],
      },
    },
    {
      valueType: "password",
      dataIndex: "pass",
      title: "认证密码",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入认证密码" }],
      },
    },
    {
      valueType: "mentions",
      search: true,
      dataIndex: "address",
      title: "发送者邮箱",
      formItemProps: {
        rules: [{ required: true, message: "请输入发送者邮箱" }],
      },
      fieldProps: {
        prefix: ["@"],
        options: ["163.com", "qq.com", "ww.com"].map((value) => ({
          key: value,
          value,
          label: value,
        })),
      },
    },
  ];

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(8px)",
        padding: "25px" /* 增加内边距 */,
        borderRadius: "10px" /* 圆角 */,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" /* 轻微阴影 */,
        // width: '100%', /* 宽度自适应 */
        // maxWidth: '800px', /* 最大宽度限制 */
        // margin: '0 auto', /* 居中显示 */
      }}
    >
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存配置
        </Button>
        <Button onClick={loadEmailSettings} loading={loading}>
          重新加载
        </Button>
      </div>

      <WjForm
        form={formRef}
        formType="basic"
        noCard={true}
        layout="vertical"
        formConfigList={columns?.filter((item) => item?.search)}
      />
    </div>
  );
}
