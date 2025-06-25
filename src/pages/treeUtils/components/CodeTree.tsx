/**
 * @file 代码树主组件
 * @description 整合所有子组件，管理状态和业务逻辑
 */
import React, { useState, useEffect } from "react";
import { Layout, message } from "antd";
import type { DataNode } from "antd/es/tree";
import CodeTreePanel from "./CodeTreePanel";
import CodePreview from "./CodePreview";
import CodeModal from "./CodeModal";
import ShareModal from "./ShareModal";
import { formatCode } from "../utils/codeFormatter";
import { indexedDBService } from "@/services/indexedDB";
import type { TreeNode, CodeSnippet } from "../types";
import "../style.less";

const { Sider, Content } = Layout;

/**
 * 代码树主组件
 */
const CodeTree: React.FC = () => {
  // 状态管理
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [modalData, setModalData] = useState<CodeSnippet>({
    key: "",
    title: "",
    code: "",
    language: "javascript",
    parentKey: "",
  });
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // 加载数据
  useEffect(() => {
    loadTreeData();
  }, []);

  /**
   * 加载树形数据
   */
  const loadTreeData = async () => {
    try {
      const data = await indexedDBService.getAllSnippets();
      console.log("加载的树形数据:", data);

      // 如果没有数据，添加一些示例数据
      if (data.length === 0) {
        await addSampleData();
        const newData = await indexedDBService.getAllSnippets();
        console.log("添加示例数据后:", newData);
        setTreeData(newData);
      } else {
        setTreeData(data);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      message.error("加载数据失败");
    }
  };

  /**
   * 添加示例数据
   */
  const addSampleData = async () => {
    const sampleData = [
      {
        key: "root_1",
        title: "JavaScript 示例",
        code: `function hello() {
  console.log("Hello, World!");
}`,
        language: "javascript",
        parentKey: "",
      },
      {
        key: "root_2",
        title: "HTML 示例",
        code: `<!DOCTYPE html>
<html>
<head>
  <title>示例页面</title>
</head>
<body>
  <h1>欢迎使用代码片段工具</h1>
</body>
</html>`,
        language: "html",
        parentKey: "",
      },
      {
        key: "child_1",
        title: "CSS 样式",
        code: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}`,
        language: "css",
        parentKey: "root_2",
      },
    ];

    for (const item of sampleData) {
      await indexedDBService.addSnippet(item);
    }
  };

  /**
   * 处理节点选择
   * @param {string} key - 节点 key
   */
  const handleSelect = (key: string) => {
    console.log("选择节点:", key);
    setSelectedKey(key);
  };

  /**
   * 处理添加节点
   * @param {string} parentKey - 父节点 key
   */
  const handleAdd = (parentKey: string) => {
    setModalType("add");
    setModalData({
      key: "",
      title: "",
      code: "",
      language: "javascript",
      parentKey: parentKey === "root" ? "" : parentKey,
    });
    setModalVisible(true);
  };

  /**
   * 处理编辑节点
   * @param {string} key - 节点 key
   */
  const handleEdit = async (key: string) => {
    try {
      const data = await indexedDBService.getSnippetByKey(key);
      if (!data) {
        message.error("节点不存在");
        return;
      }
      setModalType("edit");
      setModalData({
        key,
        title: data.title,
        code: data.code || "",
        language: data.language || "javascript",
        parentKey: data.parentKey || "",
      });
      setModalVisible(true);
    } catch (error) {
      message.error("获取节点数据失败");
    }
  };

  /**
   * 处理删除节点
   * @param {string} key - 节点 key
   */
  const handleDelete = async (key: string) => {
    try {
      await indexedDBService.deleteSnippet(key);
      message.success("删除成功");
      loadTreeData();
      if (selectedKey === key) {
        setSelectedKey("");
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  /**
   * 处理模态框确认
   * @param {CodeSnippet} values - 表单值
   */
  const handleModalOk = async (values: CodeSnippet) => {
    try {
      if (modalType === "add") {
        const newKey = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await indexedDBService.addSnippet({
          ...values,
          key: newKey,
          parentKey: modalData.parentKey || "",
        });
        message.success("添加成功");
      } else {
        await indexedDBService.updateSnippet({
          ...values,
          key: modalData.key,
          parentKey: modalData.parentKey,
        });
        message.success("更新成功");
      }
      setModalVisible(false);
      loadTreeData();
    } catch (error) {
      message.error(modalType === "add" ? "添加失败" : "更新失败");
    }
  };

  /**
   * 处理代码格式化
   */
  const handleFormat = async () => {
    try {
      const formattedCode = await formatCode(
        modalData.code,
        modalData.language
      );
      setModalData((prev) => ({ ...prev, code: formattedCode }));
    } catch (error) {
      message.error("格式化失败");
    }
  };

  /**
   * 处理分享
   */
  const handleShare = async () => {
    try {
      const shareId = await indexedDBService.shareSnippet(selectedKey);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      setShareUrl(shareUrl);
      setShareModalVisible(true);
    } catch (error) {
      message.error("生成分享链接失败");
    }
  };

  /**
   * 处理复制代码
   */
  const handleCopy = async () => {
    try {
      const data = await indexedDBService.getSnippetByKey(selectedKey);
      if (data?.code) {
        await navigator.clipboard.writeText(data.code);
        message.success("复制成功");
      } else {
        message.error("没有可复制的代码");
      }
    } catch (error) {
      message.error("复制失败");
    }
  };

  /**
   * 处理语言切换
   * @param {string} language - 新的语言
   */
  const handleLanguageChange = async (language: string) => {
    try {
      const data = await indexedDBService.getSnippetByKey(selectedKey);
      if (data) {
        await indexedDBService.updateSnippet({
          ...data,
          language,
        });
        loadTreeData();
      }
    } catch (error) {
      message.error("更新语言失败");
    }
  };

  /**
   * 递归查找节点
   * @param {TreeNode[]} nodes - 节点数组
   * @param {string} key - 要查找的节点 key
   * @returns {TreeNode | null} 找到的节点或 null
   */
  const findNodeByKey = (nodes: TreeNode[], key: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeByKey(node.children, key);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 获取当前选中节点的数据
  const selectedNode = findNodeByKey(treeData, selectedKey);

  return (
    <Layout className="code-tree-container">
      <Sider width={300} theme="light" className="code-tree-panel">
        <CodeTreePanel
          treeData={treeData}
          selectedKey={selectedKey}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Sider>
      <Content className="code-tree-preview">
        <CodePreview
          title={selectedNode?.title || ""}
          code={selectedNode?.code || ""}
          language={selectedNode?.language || "javascript"}
          isSelected={!!selectedKey}
          onCopy={handleCopy}
          onShare={handleShare}
          onFormat={handleFormat}
          onLanguageChange={handleLanguageChange}
        />
      </Content>
      <CodeModal
        visible={modalVisible}
        type={modalType}
        title={modalData.title}
        code={modalData.code}
        language={modalData.language}
        parentKey={modalData.parentKey}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
      />
      <ShareModal
        visible={shareModalVisible}
        shareUrl={shareUrl}
        onCancel={() => setShareModalVisible(false)}
      />
    </Layout>
  );
};

export default CodeTree;
