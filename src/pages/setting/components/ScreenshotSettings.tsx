import React, { useEffect } from "react";
import { Card, Input, Button, Form, message } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";

const { ipcRenderer } = window.require("electron");

const ScreenshotSettings: React.FC = () => {
  const [form] = Form.useForm();

  useEffect(() => {
    getConfigYaml().then((config: any) => {
      if (config?.screenshot) {
        form.setFieldsValue(config.screenshot);
      }
    });
  }, [form]);

  const getConfigYaml = async () => {
    return await ipcRenderer.invoke("get-config-yaml");
  };

  const updateConfigYaml = async (partial: any) => {
    return await ipcRenderer.invoke("update-config-yaml", partial);
  };

  const handleSave = async (values: any) => {
    const ok = await updateConfigYaml({ screenshot: values });
    if (ok) {
      message.success("截图配置已保存！");
    } else {
      message.error("保存失败！");
    }
  };

  const handleSelectFolder = async () => {
    const folder = await ipcRenderer.invoke("select-folder");
    if (folder) {
      form.setFieldsValue({ screenshotSavePath: folder });
    }
  };

  return (
    <Card title="无头浏览器截图配置" style={{ marginBottom: 24 }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="截图网址"
          name="screenshotUrl"
          rules={[{ required: true, message: "请输入截图网址" }]}
        >
          <Input.TextArea rows={2} placeholder="如：https://www.example.com" />
        </Form.Item>
        <Form.Item
          label="截图文件保存路径"
          name="screenshotSavePath"
          rules={[{ required: true, message: "请输入保存路径" }]}
        >
          <Input
            placeholder="如：D:\\screenshots"
            addonAfter={
              <Button
                icon={<FolderOpenOutlined />}
                onClick={handleSelectFolder}
              >
                选择
              </Button>
            }
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ScreenshotSettings;
