/**
 * @file 智能对话悬浮窗
 * @description 右下角悬浮，自动检索知识库并回复，支持多轮对话
 */
import React, { useRef, useState } from "react";
import { knowledgeDBService, KnowledgeItem } from "@/services/knowledgeDB";
import { Button, Input, Card, List, Tag, message, Tooltip } from "antd";
import { RobotOutlined, CloseOutlined, SendOutlined } from "@ant-design/icons";
import "./style.less";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  refItem?: KnowledgeItem;
}

const ChatBotFloat: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>();

  // 智能回复
  const handleSend = async () => {
    const question = input.trim();
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
      <Card
        title={
          <span>
            <RobotOutlined /> 智能助手
          </span>
        }
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setVisible(false)}
          />
        }
        className="chatbot-float-card"
        bodyStyle={{ padding: 12, height: 320, overflow: "auto" }}
        style={{ width: 360 }}
      >
        <List
          dataSource={messages}
          renderItem={(msg, idx) => (
            <List.Item
              key={idx}
              className={
                msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"
              }
            >
              <div>
                <div
                  style={{
                    fontWeight: 500,
                    color: msg.role === "user" ? "#1677ff" : "#52c41a",
                  }}
                >
                  {msg.role === "user" ? "我：" : "助手："}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                {msg.role === "bot" && msg.refItem && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">分类：{msg.refItem.category}</Tag>
                    {msg.refItem.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
      <div className="chatbot-float-input-bar">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="请输入您的问题..."
          disabled={loading}
          maxLength={100}
          style={{ width: 260, marginRight: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default ChatBotFloat;
