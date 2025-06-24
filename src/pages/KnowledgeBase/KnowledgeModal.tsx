/**
 * @file 知识库新增/编辑弹窗
 */
import React, { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";
import type { KnowledgeItem } from "@/services/knowledgeDB";

const { TextArea } = Input;
const { Option } = Select;

interface KnowledgeModalProps {
  visible: boolean;
  item: KnowledgeItem | null;
  onCancel: () => void;
  onOk: (item: KnowledgeItem) => void;
  allCategories: string[];
  allTags: string[];
}

const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  visible,
  item,
  onCancel,
  onOk,
  allCategories,
  allTags,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(
        item || {
          question: "",
          answer: "",
          category: "",
          tags: [],
        }
      );
    }
  }, [visible, item, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const now = new Date().toISOString();
    onOk({
      ...item,
      ...values,
      id:
        item?.id ||
        `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: item?.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <Modal
      open={visible}
      title={item ? "编辑知识条目" : "新增知识条目"}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="问题"
          name="question"
          rules={[{ required: true, message: "请输入问题" }]}
        >
          <Input maxLength={100} placeholder="请输入问题" />
        </Form.Item>
        <Form.Item
          label="答案"
          name="answer"
          rules={[{ required: true, message: "请输入答案" }]}
        >
          <TextArea rows={4} maxLength={1000} placeholder="请输入答案" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Select
            showSearch
            allowClear
            placeholder="请选择或输入分类"
            optionFilterProp="children"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: 8 }}>
                  <Input
                    style={{ width: "100%" }}
                    placeholder="自定义分类，回车添加"
                    onPressEnter={(e) => {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !allCategories.includes(value)) {
                        form.setFieldsValue({ category: value });
                      }
                    }}
                  />
                </div>
              </>
            )}
          >
            {allCategories.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="标签" name="tags">
          <Select
            mode="tags"
            placeholder="请输入标签，回车分隔"
            style={{ width: "100%" }}
          >
            {allTags.map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="文档引用" name="documentUrl">
          <Input placeholder="请输入文档URL地址（可选）" maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default KnowledgeModal;
