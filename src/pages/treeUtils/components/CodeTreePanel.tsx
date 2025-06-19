/**
 * @file 代码树面板组件
 * @description 用于显示代码树结构和节点操作按钮
 */
import React from "react";
import { Card, Tree, Button, Space, Dropdown, Menu } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import type { TreeNode } from "../types";

/**
 * CodeTreePanel 组件 props
 * @typedef {Object} CodeTreePanelProps
 * @property {TreeNode[]} treeData - 树形数据
 * @property {string} selectedKey - 当前选中的节点 key
 * @property {(key: string) => void} onSelect - 节点选择回调
 * @property {(key: string) => void} onAdd - 添加节点回调
 * @property {(key: string) => void} onEdit - 编辑节点回调
 * @property {(key: string) => void} onDelete - 删除节点回调
 */
interface CodeTreePanelProps {
  treeData: TreeNode[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onAdd: (key: string) => void;
  onEdit: (key: string) => void;
  onDelete: (key: string) => void;
}

/**
 * 代码树面板组件
 * @param {CodeTreePanelProps} props
 */
const CodeTreePanel: React.FC<CodeTreePanelProps> = ({
  treeData,
  selectedKey,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  /**
   * 渲染节点操作按钮
   * @param {string} key - 节点 key
   * @returns {React.ReactNode}
   */
  const renderNodeActions = (key: string) => {
    const menu = (
      <Menu
        items={[
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "编辑",
            onClick: () => onEdit(key),
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "删除",
            onClick: () => onDelete(key),
          },
        ]}
      />
    );

    return (
      <div className="node-actions">
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(key);
          }}
          title="添加子节点"
          size="small"
        />
        <Dropdown overlay={menu} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
        </Dropdown>
      </div>
    );
  };

  /**
   * 渲染节点标题
   * @param {TreeNode} node - 树节点数据
   * @returns {React.ReactNode}
   */
  const renderTitle = (node: TreeNode) => (
    <div className="tree-node-content">
      <span className="node-title">{node.title}</span>
      {renderNodeActions(node.key)}
    </div>
  );

  return (
    <Card
      title="代码片段"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAdd("root")}
        >
          添加根节点
        </Button>
      }
      style={{ width: 300 }}
    >
      <Tree
        treeData={treeData}
        selectedKeys={[selectedKey]}
        onSelect={(_, { node }) => onSelect(node.key as string)}
        titleRender={renderTitle}
        blockNode
      />
    </Card>
  );
};

export default CodeTreePanel;
