/**
 * @file 代码粘贴工具
 */
import React, { useState, useEffect } from "react";
import {
  Tree,
  Card,
  Button,
  message,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  CopyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons";
import { indexedDBService, type CodeNode } from "@/services/indexedDB";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { format } from "prettier/standalone";
import parserBabel from "prettier/parser-babel";
import parserHtml from "prettier/parser-html";
import parserCss from "prettier/parser-postcss";
import "./style.less";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CodeTree: React.FC = () => {
  const [codeTree, setCodeTree] = useState<CodeNode[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("text");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [form] = Form.useForm();
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  /**
   * 加载代码片段数据
   */
  const loadData = async () => {
    try {
      const snippets = await indexedDBService.getAllSnippets();
      setCodeTree(snippets);
    } catch (error) {
      message.error("加载数据失败");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const node = info.node as CodeNode;
    if (node.code) {
      setSelectedCode(node.code);
      setSelectedTitle(node.title as string);
      setSelectedKey(node.key as string);
      // 使用保存的语言设置，如果没有则根据文件扩展名自动选择
      if (node.language) {
        setSelectedLanguage(node.language);
      } else {
        const extension = node.title.split(".").pop()?.toLowerCase();
        let language = "text";
        switch (extension) {
          case "js":
          case "jsx":
          case "ts":
          case "tsx":
            language = "javascript";
            break;
          case "css":
          case "scss":
          case "less":
            language = "css";
            break;
          case "html":
          case "htm":
            language = "html";
            break;
          case "json":
            language = "json";
            break;
          case "yml":
          case "yaml":
            language = "yaml";
            break;
        }
        setSelectedLanguage(language);
        // 保存自动检测的语言设置
        indexedDBService.updateSnippet({
          ...node,
          language,
        });
      }
    }
  };

  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language);
    // 更新当前节点的语言设置
    const node = await indexedDBService.getSnippetByKey(selectedKey);
    if (node) {
      await indexedDBService.updateSnippet({
        ...node,
        language,
      });
    }
  };

  const handleCopy = () => {
    if (selectedCode) {
      navigator.clipboard.writeText(selectedCode).then(
        () => {
          message.success("代码已复制到剪贴板");
        },
        () => {
          message.error("复制失败，请手动复制");
        }
      );
    }
  };

  /**
   * 自动识别代码语言
   */
  const detectLanguage = (code: string): string => {
    // 尝试解析为 JSON
    try {
      JSON.parse(code);
      return "json";
    } catch (e) {
      // 不是 JSON，继续检测
    }

    // 检测 YAML
    if (code.trim().startsWith("---") || /^[a-zA-Z0-9_-]+:/.test(code)) {
      return "yaml";
    }

    // 检测 HTML
    if (/<[a-z][\s\S]*>/i.test(code)) {
      return "html";
    }

    // 检测 CSS
    if (/{[\s\S]*}/.test(code) && /:[^;]+;/.test(code)) {
      return "css";
    }

    // 检测 JavaScript
    if (
      /function\s+\w+\s*\(|const\s+\w+\s*=|\bvar\s+\w+\s*=|\blet\s+\w+\s*=/.test(
        code
      )
    ) {
      return "javascript";
    }

    return "text";
  };

  /**
   * 格式化代码
   */
  const formatCode = async (
    code: string,
    language: string
  ): Promise<string> => {
    try {
      let parser;
      let plugins = [];

      switch (language) {
        case "javascript":
          parser = "babel";
          plugins = [parserBabel];
          break;
        case "html":
          parser = "html";
          plugins = [parserHtml];
          break;
        case "css":
          parser = "css";
          plugins = [parserCss];
          break;
        case "json":
          parser = "json";
          plugins = [parserBabel];
          break;
        default:
          return code;
      }

      const formattedCode = await format(code, {
        parser,
        plugins,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: "es5" as const,
        bracketSpacing: true,
        arrowParens: "avoid" as const,
      });

      return formattedCode;
    } catch (error) {
      console.error("格式化失败:", error);
      return code;
    }
  };

  const showModal = (type: "add" | "edit", parentKey?: string) => {
    setModalType(type);
    if (type === "edit") {
      form.setFieldsValue({
        title: selectedTitle,
        code: selectedCode,
        language: selectedLanguage,
      });
    } else {
      form.resetFields();
      if (parentKey) {
        form.setFieldsValue({ parentKey });
      }
    }
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const detectedLanguage = detectLanguage(values.code);
      const formattedCode = await formatCode(values.code, detectedLanguage);

      if (modalType === "add") {
        const key = `node_${Date.now()}`;
        await indexedDBService.addSnippet({
          key,
          title: values.title,
          code: formattedCode,
          parentKey: values.parentKey,
          language: detectedLanguage,
        });
      } else {
        await indexedDBService.updateSnippet({
          key: selectedKey,
          title: values.title,
          code: formattedCode,
          language: detectedLanguage,
        });
        // 更新当前选中的代码
        setSelectedCode(formattedCode);
        setSelectedLanguage(detectedLanguage);
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleDelete = async () => {
    try {
      await indexedDBService.deleteSnippet(selectedKey);
      setSelectedCode("");
      setSelectedTitle("");
      setSelectedKey("");
      loadData();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleShare = async () => {
    try {
      const shareId = await indexedDBService.shareSnippet(selectedKey);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      setShareUrl(shareUrl);
      setShareModalVisible(true);
    } catch (error) {
      message.error("分享失败");
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        message.success("分享链接已复制到剪贴板");
      },
      () => {
        message.error("复制失败，请手动复制");
      }
    );
  };

  const titleRender = (node: CodeNode) => {
    const isSelected = node.key === selectedKey;
    return (
      <Space className="tree-node-content">
        <span className="node-title">{node.title}</span>
        {isSelected && (
          <div className="node-actions">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                showModal("add", node.key);
              }}
            />
            {node.code && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    showModal("edit");
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: "确认删除",
                      content: "确定要删除这个代码片段吗？",
                      onOk: handleDelete,
                    });
                  }}
                />
              </>
            )}
          </div>
        )}
      </Space>
    );
  };

  return (
    <div style={{ display: "flex", gap: "16px", padding: "16px" }}>
      <Card
        title="代码列表"
        style={{ width: "300px", overflow: "auto" }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            添加根节点
          </Button>
        }
      >
        <Tree
          treeData={codeTree}
          onSelect={handleSelect}
          defaultExpandAll
          titleRender={titleRender}
          showIcon
          showLine
          blockNode
        />
      </Card>

      <Card
        title={
          <div className="card-title-preview">
            {selectedTitle || "代码预览"}
          </div>
        }
        style={{ flex: 1 }}
        extra={
          selectedCode && (
            <Space>
              <Select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                style={{ width: 120 }}
              >
                <Option value="text">Text</Option>
                <Option value="javascript">JavaScript</Option>
                <Option value="css">CSS</Option>
                <Option value="html">HTML</Option>
                <Option value="json">JSON</Option>
                <Option value="yaml">YAML</Option>
              </Select>
              <Button
                icon={<FormatPainterOutlined />}
                onClick={() => showModal("edit")}
                title="格式化代码"
              />
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={handleCopy}
              >
                复制代码
              </Button>
              <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                分享
              </Button>
            </Space>
          )
        }
      >
        {selectedCode ? (
          <SyntaxHighlighter
            language={selectedLanguage}
            style={vscDarkPlus}
            customStyle={{
              background: "#1e1e1e",
              padding: "16px",
              borderRadius: "4px",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            {selectedCode}
          </SyntaxHighlighter>
        ) : (
          <Text type="secondary">请从左侧选择要查看的代码</Text>
        )}
      </Card>

      <Modal
        title="分享代码片段"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={copyShareUrl}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <div style={{ wordBreak: "break-all" }}>
          <Text>分享链接：</Text>
          <br />
          <Text copyable>{shareUrl}</Text>
        </div>
      </Modal>

      <Modal
        title={modalType === "add" ? "添加代码片段" : "编辑代码片段"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
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
            name="code"
            label="代码"
            rules={[{ required: true, message: "请输入代码" }]}
          >
            <TextArea
              rows={10}
              placeholder="输入代码后会自动格式化并识别语言"
            />
          </Form.Item>
          {modalType === "add" && (
            <Form.Item name="parentKey" hidden>
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CodeTree;
