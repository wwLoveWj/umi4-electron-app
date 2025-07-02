import React, { useState } from "react";
import { Modal, Form, Input } from "antd";

/**
 * 添加分类表单 Props
 */
interface AddCategoryFormProps {
  visible: boolean;
  onAdd: (name: string) => void;
  onCancel: () => void;
}

/**
 * 添加分类表单
 */
const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  visible,
  onAdd,
  onCancel,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onAdd(values.name);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="添加新分类"
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
          name="name"
          label="分类名"
          rules={[{ required: true, message: "请输入分类名" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCategoryForm;
