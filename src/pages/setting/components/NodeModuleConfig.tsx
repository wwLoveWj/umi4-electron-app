import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const LOCAL_KEY = "customNodeTypes";

interface CustomField {
  key: string;
  label: string;
  type: string;
}

interface CustomNodeType {
  type: string;
  name: string;
  icon: string;
  fields?: CustomField[];
}

const PRESET_NODES: CustomNodeType[] = [
  { type: "start", name: "发起人", icon: "🚀" },
  { type: "approver", name: "审批人", icon: "👤" },
  { type: "condition", name: "条件分支", icon: "🔀" },
  { type: "parallel", name: "并行审批", icon: "⚡" },
  { type: "auto", name: "自动审批", icon: "🤖" },
  { type: "email", name: "邮件催办", icon: "📧" },
  { type: "end", name: "结束节点", icon: "🏁" },
];

export default function NodeModuleConfig() {
  const [data, setData] = useState<CustomNodeType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CustomNodeType | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    setData(saved ? JSON.parse(saved) : []);
  }, []);

  // 合并预设节点和自定义节点
  const mergedData: CustomNodeType[] = [
    ...PRESET_NODES.map((preset) => {
      const local = data.find((d) => d.type === preset.type);
      return local ? { ...preset, ...local } : preset;
    }),
    ...data.filter((d) => !PRESET_NODES.some((p) => p.type === d.type)),
  ];

  const save = (list: CustomNodeType[]) => {
    setData(list);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  };

  const handleAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const handleEdit = (record: CustomNodeType) => {
    setEditing(record);
    setModalVisible(true);
  };

  const handleDelete = (type: string) => {
    if (PRESET_NODES.some((p) => p.type === type)) return;
    const list = data.filter((item) => item.type !== type);
    save(list);
  };

  const handleOk = (values: CustomNodeType) => {
    let list = [...data];
    if (PRESET_NODES.some((p) => p.type === values.type)) {
      list = list.filter((item) => item.type !== values.type);
      list.push(values);
    } else if (editing) {
      list = list.map((item) =>
        item.type === editing.type ? { ...editing, ...values } : item
      );
    } else {
      list.push(values);
    }
    save(list);
    setModalVisible(false);
  };

  return (
    <div>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        新增节点模块
      </Button>
      <Table
        dataSource={mergedData}
        rowKey="type"
        columns={[
          { title: "标识", dataIndex: "type" },
          { title: "名称", dataIndex: "name" },
          { title: "图标", dataIndex: "icon" },
          {
            title: "操作",
            render: (_, record) => (
              <>
                <Button
                  size="small"
                  onClick={() => handleEdit(record)}
                  style={{ marginRight: 8 }}
                >
                  编辑
                </Button>
                <Button
                  size="small"
                  danger
                  disabled={PRESET_NODES.some((p) => p.type === record.type)}
                  onClick={() => handleDelete(record.type)}
                >
                  删除
                </Button>
              </>
            ),
          },
        ]}
      />
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => {
          document.getElementById("node-module-form-submit")?.click();
        }}
        title={editing ? "编辑节点模块" : "新增节点模块"}
        destroyOnClose
      >
        <Form
          initialValues={
            editing || { type: "", name: "", icon: "", fields: [] }
          }
          onFinish={handleOk}
          layout="vertical"
        >
          <Form.Item name="type" label="唯一标识" rules={[{ required: true }]}>
            <Input
              disabled={
                !!editing ||
                PRESET_NODES.some((p) => p.type === (editing?.type || ""))
              }
            />
          </Form.Item>
          <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="icon" label="图标(emoji或iconfont)">
            <Input />
          </Form.Item>
          <Form.List name="fields">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                  自定义属性字段
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{ display: "flex", gap: 8, marginBottom: 8 }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "key"]}
                      rules={[{ required: true, message: "字段名" }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="字段名（如 owner）" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "label"]}
                      rules={[{ required: true, message: "显示名" }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="显示名（如 负责人）" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "type"]}
                      rules={[{ required: true, message: "类型" }]}
                      style={{ flex: 1 }}
                    >
                      <Select placeholder="类型">
                        <Select.Option value="text">文本输入框</Select.Option>
                        <Select.Option value="number">数字输入框</Select.Option>
                        <Select.Option value="select">下拉选择</Select.Option>
                        <Select.Option value="textarea">多行文本</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      shouldUpdate={(prev, curr) =>
                        prev.fields?.[name]?.type !== curr.fields?.[name]?.type
                      }
                      style={{ flex: 2, marginBottom: 0 }}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue(["fields", name, "type"]) === "select" ? (
                          <Form.Item
                            name={[name, "options"]}
                            noStyle
                            rules={[
                              { required: true, message: "请输入下拉选项" },
                            ]}
                          >
                            <Input placeholder="下拉选项，逗号分隔，如A,B,C" />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加字段
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Button
            id="node-module-form-submit"
            htmlType="submit"
            style={{ display: "none" }}
          />
        </Form>
      </Modal>
    </div>
  );
}
