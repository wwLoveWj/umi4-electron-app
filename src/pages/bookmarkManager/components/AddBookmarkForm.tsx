import React, { useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { Category } from "./types";

/**
 * 添加链接表单 Props
 */
interface AddBookmarkFormProps {
  visible: boolean;
  categories: Category[];
  onAdd: (bm: {
    url: string;
    title: string;
    description: string;
    categoryId: string;
  }) => void;
  onCancel: () => void;
}

/**
 * 添加链接表单
 */
const AddBookmarkForm: React.FC<AddBookmarkFormProps> = ({
  visible,
  categories,
  onAdd,
  onCancel,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onAdd(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="添加新链接"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText="添加"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: "请输入标题" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="url"
          label="链接"
          rules={[{ required: true, type: "url", message: "请输入有效的URL" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="categoryId"
          label="分类"
          rules={[{ required: true, message: "请选择分类" }]}
        >
          <Select
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddBookmarkForm;
