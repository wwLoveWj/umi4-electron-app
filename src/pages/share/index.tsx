/**
 * @file 代码片段分享页面
 */
import React, { useEffect, useState } from "react";
import { useParams, history } from "umi";
import { Card, Button, message, Typography, Spin, Space } from "antd";
import { CopyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { indexedDBService, type CodeNode } from "@/services/indexedDB";

const { Text } = Typography;

const SharePage: React.FC = () => {
  const { shareId = "" } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [snippet, setSnippet] = useState<CodeNode | null>(null);

  useEffect(() => {
    if (shareId) {
      loadSharedSnippet();
    }
  }, [shareId]);

  const loadSharedSnippet = async () => {
    try {
      setLoading(true);
      const sharedSnippet = await indexedDBService.getSharedSnippet(shareId);
      if (!sharedSnippet) {
        message.error("分享的代码片段不存在或已过期");
        history.push("/treeUtils");
        return;
      }
      setSnippet(sharedSnippet);
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (snippet?.code) {
      navigator.clipboard.writeText(snippet.code).then(
        () => {
          message.success("代码已复制到剪贴板");
        },
        () => {
          message.error("复制失败，请手动复制");
        }
      );
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Spin spinning={loading}>
        <Card
          title={snippet?.title || "代码片段"}
          extra={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => history.push("/treeUtils")}
              >
                返回
              </Button>
              {snippet?.code && (
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                >
                  复制代码
                </Button>
              )}
            </Space>
          }
        >
          {snippet?.code ? (
            <pre
              style={{
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "calc(100vh - 200px)",
              }}
            >
              <code>{snippet.code}</code>
            </pre>
          ) : (
            <Text type="secondary">代码片段不存在</Text>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default SharePage;
