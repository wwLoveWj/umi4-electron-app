import React, { useState, useEffect } from "react";
import { Modal, Form, Input } from "antd";
import { ApprovalFlow } from "./types";

const { TextArea } = Input;

interface FlowEditModalProps {
  visible: boolean;
  editingFlow: ApprovalFlow | null;
  onCancel: () => void;
  onOk: () => void;
  onFlowChange: (flow: ApprovalFlow | null) => void;
}

/**
 * 流程编辑弹窗组件
 */
const FlowEditModal: React.FC<FlowEditModalProps> = ({
  visible,
  editingFlow,
  onCancel,
  onOk,
  onFlowChange,
}) => {
  const [formData, setFormData] = useState({ name: "", description: "" });

  // 当弹窗打开时，初始化表单数据
  useEffect(() => {
    if (visible) {
      if (editingFlow) {
        setFormData({
          name: editingFlow.name || "",
          description: editingFlow.description || "",
        });
      } else {
        setFormData({ name: "", description: "" });
      }
    }
  }, [visible, editingFlow]);

  // 判断是新建还是编辑：如果 editingFlow 存在但没有 id，则为新建
  const isEdit = editingFlow && editingFlow.id;
  const modalTitle = isEdit ? "编辑流程" : "新建流程";

  // 创建默认的新建流程对象
  const createNewFlow = (): ApprovalFlow => ({
    id: "",
    name: formData.name,
    description: formData.description,
    nodes: [],
    edges: [],
    isActive: false,
    createdAt: "",
    updatedAt: "",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => ({ ...prev, name: newName }));

    if (editingFlow) {
      onFlowChange({ ...editingFlow, name: newName });
    } else {
      onFlowChange(createNewFlow());
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newDescription = e.target.value;
    setFormData((prev) => ({ ...prev, description: newDescription }));

    if (editingFlow) {
      onFlowChange({ ...editingFlow, description: newDescription });
    } else {
      onFlowChange(createNewFlow());
    }
  };

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      width={500}
    >
      <Form layout="vertical">
        <Form.Item
          label="流程名称"
          rules={[{ required: true, message: "请输入流程名称" }]}
        >
          <Input
            value={formData.name}
            onChange={handleNameChange}
            placeholder="请输入流程名称"
          />
        </Form.Item>
        <Form.Item label="流程描述">
          <TextArea
            value={formData.description}
            onChange={handleDescriptionChange}
            rows={3}
            placeholder="请输入流程描述"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FlowEditModal;
