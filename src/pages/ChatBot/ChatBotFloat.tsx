/**
 * @file 智能对话悬浮窗
 * @description 右下角悬浮，自动检索知识库并回复，支持多轮对话，美观卡片、预置标签
 */
import React, { useRef, useState, useEffect } from "react";
import { knowledgeDBService, KnowledgeItem } from "@/services/knowledgeDB";
import {
  Button,
  Input,
  Card,
  List,
  Tag,
  Tooltip,
  Empty,
  Space,
  Divider,
  Select,
} from "antd";
import {
  RobotOutlined,
  CloseOutlined,
  SendOutlined,
  QuestionCircleOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import "./style.less";
import { v4 as uuidv4 } from "uuid";

/**
 * 单条消息类型
 */
interface ChatMessage {
  role: "user" | "bot";
  content: string;
  refItem?: KnowledgeItem;
}

/**
 * 单个会话类型
 */
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

const presetQuestions = [
  "如何添加新知识？",
  "知识条目可以有多个标签吗？",
  "如何按分类筛选？",
  "如何删除知识？",
  "标签和分类的区别是什么？",
];

const ChatBotFloat: React.FC = () => {
  const [visible, setVisible] = useState(false);
  /**
   * 所有会话列表
   */
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: uuidv4(), title: "会话1", messages: [] },
  ]);
  /**
   * 当前激活会话id
   */
  const [activeId, setActiveId] = useState<string>(conversations[0].id);
  /**
   * 当前输入内容
   */
  const [input, setInput] = useState("");
  /**
   * 当前加载状态
   */
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>();
  /**
   * 消息区底部ref，用于自动滚动到最新消息
   * @type {React.RefObject<HTMLDivElement>}
   */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /**
   * 记录每条消息的复制状态，key为消息索引，值为true表示已复制
   * @type {[Record<number, boolean>, React.Dispatch<React.SetStateAction<Record<number, boolean>>>]}
   */
  const [copiedMap, setCopiedMap] = useState<Record<number, boolean>>({});

  /**
   * 获取当前激活会话对象
   */
  const activeConversation = conversations.find((c) => c.id === activeId)!;

  /**
   * 每当消息(messages)变化时，自动滚动到底部
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation.messages]);

  /**
   * 发送消息并检索知识库，更新当前会话
   * @param {string} [q] - 可选，直接发送的内容
   */
  const handleSend = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question) return;
    setInput("");
    setLoading(true);
    // 先添加用户消息
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, { role: "user", content: question }],
            }
          : c
      )
    );
    // 检索知识库
    const results = await knowledgeDBService.search(question);
    let reply: ChatMessage;
    if (results.length > 0) {
      reply = {
        role: "bot",
        content: results[0].answer,
        refItem: results[0],
      };
    } else {
      reply = {
        role: "bot",
        content: "很抱歉，知识库中没有找到相关答案。",
      };
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c
      )
    );
    setLoading(false);
  };

  // 回车发送
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  // 新建会话
  /**
   * 新建一个空会话并切换到该会话
   */
  const handleNewConversation = () => {
    const newId = uuidv4();
    setConversations((prev) => [
      ...prev,
      { id: newId, title: `会话${prev.length + 1}`, messages: [] },
    ]);
    setActiveId(newId);
  };

  // 切换会话
  /**
   * 切换到指定会话
   * @param {string} id 会话id
   */
  const handleSwitchConversation = (id: string) => {
    setActiveId(id);
  };

  // 悬浮按钮
  if (!visible) {
    return (
      <Tooltip title="智能助手">
        <Button
          type="primary"
          shape="circle"
          icon={<RobotOutlined />}
          size="large"
          className="chatbot-float-btn"
          onClick={() => setVisible(true)}
        />
      </Tooltip>
    );
  }

  return (
    <div className="chatbot-float-window">
      <div className="chatbot-float-panel">
        {/* 会话列表与新建按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            padding: "8px 12px 4px 12px",
            background: "#fafdff",
          }}
        >
          <Select
            value={activeId}
            onChange={handleSwitchConversation}
            style={{ flex: 1, marginRight: 8 }}
            placeholder="选择会话"
            options={conversations.map((c) => ({
              label: c.title,
              value: c.id,
            }))}
          />
          <Button
            type="dashed"
            size="small"
            onClick={handleNewConversation}
            style={{ marginLeft: 8 }}
          >
            新建会话
          </Button>
        </div>
        <div className="chatbot-preset-bar-vertical">
          <span className="kb-preset-title">你可以这样问：</span>
          <div className="chatbot-preset-tags">
            {presetQuestions.map((q) => (
              <Tag
                key={q}
                color="geekblue"
                className="kb-preset-tag"
                onClick={() => handleSend(q)}
                style={{ cursor: "pointer", marginBottom: 6 }}
              >
                {q}
              </Tag>
            ))}
          </div>
        </div>
        <div className="chatbot-float-content">
          {activeConversation.messages.length === 0 ? (
            <div className="kb-empty-block chatbot-empty-block">
              <Empty
                description={<span style={{ color: "#888" }}>暂无对话</span>}
              />
            </div>
          ) : (
            <div className="kb-qa-list chatbot-qa-list">
              {activeConversation.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chatbot-qa-row ${msg.role === "user" ? "chatbot-qa-row-user" : "chatbot-qa-row-bot"}`}
                >
                  <Card
                    className={`kb-qa-card chatbot-qa-card ${msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"}`}
                    bordered={false}
                    bodyStyle={{ padding: 14 }}
                    style={{
                      marginBottom: 12,
                      background: msg.role === "user" ? "#e6f4ff" : "#fff",
                      maxWidth: "85%",
                      marginLeft: msg.role === "user" ? "auto" : 0,
                      marginRight: msg.role === "user" ? 0 : "auto",
                    }}
                  >
                    <div className="chatbot-qa-header">
                      <span className={`chatbot-qa-username ${msg.role}`}>
                        {msg.role === "user" ? (
                          <>
                            <RobotOutlined /> 我
                          </>
                        ) : (
                          <>
                            <RobotOutlined /> 助手
                          </>
                        )}
                      </span>
                    </div>
                    <div className="chatbot-qa-content">{msg.content}</div>
                    {msg.role === "bot" && msg.refItem && (
                      <div className="chatbot-qa-meta">
                        <Tag color="blue">分类：{msg.refItem.category}</Tag>
                        {msg.refItem.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    )}
                    {msg.role === "bot" && msg.refItem && (
                      <div
                        className="chatbot-qa-answer"
                        style={{ position: "relative", paddingBottom: 28 }}
                      >
                        {msg.refItem.answer}
                        <Button
                          type="text"
                          icon={
                            copiedMap[idx] ? (
                              <CheckOutlined style={{ color: "#52c41a" }} />
                            ) : (
                              <CopyOutlined />
                            )
                          }
                          size="small"
                          style={{ position: "absolute", right: 4, bottom: 4 }}
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              msg.refItem!.answer
                            );
                            setCopiedMap((prev) => ({ ...prev, [idx]: true }));
                            setTimeout(() => {
                              setCopiedMap((prev) => ({
                                ...prev,
                                [idx]: false,
                              }));
                            }, 2000);
                          }}
                          title={copiedMap[idx] ? "已复制" : "复制答案"}
                        />
                      </div>
                    )}
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="chatbot-float-input-bar">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="请输入您的问题..."
            disabled={loading}
            maxLength={100}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBotFloat;
