import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Switch,
  InputNumber,
} from "antd";
import { ApprovalNode, ApprovalNodeType, ApprovalModule } from "./types";

const { Option } = Select;
const { TextArea } = Input;

interface NodeEditModalProps {
  visible: boolean;
  node?: ApprovalNode;
  isNew?: boolean;
  onCancel: () => void;
  onOk: (node: ApprovalNode) => void;
}

/**
 * 节点编辑弹窗组件
 */
const NodeEditModal: React.FC<NodeEditModalProps> = ({
  visible,
  node,
  isNew,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [currentType, setCurrentType] = useState<ApprovalNodeType>(
    node?.type || ApprovalNodeType.APPROVER
  );

  useEffect(() => {
    if (visible && node) {
      form.setFieldsValue({
        ...node,
        type: node.type,
        approvers: node.approvers || [],
        requiredApprovers: node.requiredApprovers || [],
        conditions: node.conditions || [],
        emailRecipients: node.emailRecipients || [],
      });
      setCurrentType(node.type);
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        type: ApprovalNodeType.APPROVER,
      });
      setCurrentType(ApprovalNodeType.APPROVER);
    }
  }, [visible, node, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newNode: ApprovalNode = {
        id: node?.id || `node_${Date.now()}`,
        name: values.name,
        type: values.type,
        module: values.module,
        approvers: values.approvers || [],
        requiredApprovers: values.requiredApprovers || [],
        description: values.description,
        conditions: values.conditions || [],
        autoApprove: values.autoApprove,
        emailTemplate: values.emailTemplate,
        emailRecipients: values.emailRecipients || [],
        emailSubject: values.emailSubject,
        timeout: values.timeout,
        isRequired: values.isRequired,
        position: node?.position || { x: 100, y: 100 },
      };
      onOk(newNode);
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  const handleTypeChange = (value: ApprovalNodeType) => {
    setCurrentType(value);
  };

  return (
    <Modal
      title={isNew ? "新增审批节点" : "编辑审批节点"}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="节点名称"
              rules={[{ required: true, message: "请输入节点名称" }]}
            >
              <Input placeholder="请输入节点名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="节点类型"
              rules={[{ required: true, message: "请选择节点类型" }]}
            >
              <Select
                placeholder="请选择节点类型"
                value={currentType}
                onChange={handleTypeChange}
              >
                <Option value={ApprovalNodeType.START}>发起人</Option>
                <Option value={ApprovalNodeType.APPROVER}>审批人</Option>
                <Option value={ApprovalNodeType.CONDITION}>条件分支</Option>
                <Option value={ApprovalNodeType.PARALLEL}>并行审批</Option>
                <Option value={ApprovalNodeType.AUTO}>自动审批</Option>
                <Option value={ApprovalNodeType.EMAIL}>邮件催办</Option>
                <Option value={ApprovalNodeType.END}>结束节点</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {(currentType === ApprovalNodeType.APPROVER ||
          currentType === ApprovalNodeType.PARALLEL) && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="module"
                  label="审批模块"
                  rules={[{ required: true, message: "请选择审批模块" }]}
                >
                  <Select placeholder="请选择审批模块">
                    <Option value={ApprovalModule.KNOWLEDGE_BASE}>
                      知识库
                    </Option>
                    <Option value={ApprovalModule.DOCUMENT}>文档</Option>
                    <Option value={ApprovalModule.PROJECT}>项目</Option>
                    <Option value={ApprovalModule.EXPENSE}>费用</Option>
                    <Option value={ApprovalModule.LEAVE}>请假</Option>
                    <Option value={ApprovalModule.PURCHASE}>采购</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isRequired"
                  label="是否必须审批"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="approvers"
              label="审批人"
              rules={[{ required: true, message: "请选择审批人" }]}
            >
              <Select
                mode="tags"
                placeholder="请输入审批人姓名，回车添加"
                allowClear
              />
            </Form.Item>

            <Form.Item name="requiredApprovers" label="必审人">
              <Select
                mode="tags"
                placeholder="请输入必审人姓名，回车添加（可选）"
                allowClear
              />
            </Form.Item>
          </>
        )}

        {currentType === ApprovalNodeType.CONDITION && (
          <Form.Item
            name="conditions"
            label="条件"
            rules={[{ required: true, message: "请输入条件" }]}
          >
            <Select mode="tags" placeholder="请输入条件，回车添加" allowClear />
          </Form.Item>
        )}

        {currentType === ApprovalNodeType.AUTO && (
          <Form.Item
            name="autoApprove"
            label="自动审批结果"
            rules={[{ required: true, message: "请选择审批结果" }]}
          >
            <Select placeholder="请选择审批结果">
              <Option value={true}>自动通过</Option>
              <Option value={false}>自动拒绝</Option>
            </Select>
          </Form.Item>
        )}

        {currentType === ApprovalNodeType.EMAIL && (
          <>
            <Form.Item
              name="emailRecipients"
              label="邮件收件人"
              rules={[{ required: true, message: "请输入邮件收件人" }]}
            >
              <Select
                mode="tags"
                placeholder="请输入邮箱地址，回车添加"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="emailSubject"
              label="邮件主题"
              rules={[{ required: true, message: "请输入邮件主题" }]}
            >
              <Input placeholder="请输入邮件主题" />
            </Form.Item>

            <Form.Item name="emailTemplate" label="邮件模板">
              <TextArea rows={4} placeholder="请输入邮件模板内容（可选）" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="节点描述">
          <TextArea rows={3} placeholder="请输入节点描述（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NodeEditModal;
