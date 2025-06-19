/**
 * @file 智能对话悬浮窗
 * @description 右下角悬浮，自动检索知识库并回复，支持多轮对话，美观卡片、预置标签
 */
import React, { useRef, useState } from "react";
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
} from "antd";
import {
  RobotOutlined,
  CloseOutlined,
  SendOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import "./style.less";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  refItem?: KnowledgeItem;
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>();

  // 智能回复
  const handleSend = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question) return;
    setMessages((msgs) => [...msgs, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
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
    setMessages((msgs) => [...msgs, reply]);
    setLoading(false);
  };

  // 回车发送
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  // 预置标签点击
  const handlePresetClick = (q: string) => {
    setInput("");
    handleSend(q);
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
        <div className="chatbot-float-header">
          <span>
            <RobotOutlined /> 智能助手
          </span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            className="chatbot-float-close"
            onClick={() => setVisible(false)}
          />
        </div>
        <div className="chatbot-preset-bar-vertical">
          <span className="kb-preset-title">你可以这样问：</span>
          <div className="chatbot-preset-tags">
            {presetQuestions.map((q) => (
              <Tag
                key={q}
                color="geekblue"
                className="kb-preset-tag"
                onClick={() => handlePresetClick(q)}
                style={{ cursor: "pointer", marginBottom: 6 }}
              >
                {q}
              </Tag>
            ))}
          </div>
        </div>
        <div className="chatbot-float-content">
          {messages.length === 0 ? (
            <div className="kb-empty-block chatbot-empty-block">
              <Empty
                description={<span style={{ color: "#888" }}>暂无对话</span>}
              />
            </div>
          ) : (
            <div className="kb-qa-list chatbot-qa-list">
              {messages.map((msg, idx) => (
                <Card
                  key={idx}
                  className={`kb-qa-card chatbot-qa-card ${msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"}`}
                  bordered={false}
                  style={{
                    marginBottom: 12,
                    background: msg.role === "user" ? "#e6f4ff" : "#fff",
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <div className="kb-qa-question">
                    {msg.role === "user" ? (
                      <span style={{ color: "#1677ff", fontWeight: 500 }}>
                        <RobotOutlined /> 我：
                      </span>
                    ) : (
                      <span style={{ color: "#52c41a", fontWeight: 500 }}>
                        <RobotOutlined /> 助手：
                      </span>
                    )}
                    <span style={{ marginLeft: 8 }}>{msg.content}</span>
                    {msg.role === "bot" && msg.refItem && (
                      <>
                        <Tag color="blue" style={{ marginLeft: 12 }}>
                          分类：{msg.refItem.category}
                        </Tag>
                        {msg.refItem.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </>
                    )}
                  </div>
                  {msg.role === "bot" && msg.refItem && (
                    <div
                      className="kb-qa-answer"
                      style={{ paddingLeft: 0, marginTop: 6 }}
                    >
                      {msg.refItem.answer}
                    </div>
                  )}
                </Card>
              ))}
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
