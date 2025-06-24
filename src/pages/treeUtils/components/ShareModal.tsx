/**
 * @file 分享链接弹窗组件
 * @description 用于显示和复制代码片段的分享链接
 */
import React from "react";
import { Modal, Button, Typography, message } from "antd";

const { Text } = Typography;

/**
 * ShareModal 组件 props
 * @typedef {Object} ShareModalProps
 * @property {boolean} visible - 弹窗是否可见
 * @property {string} shareUrl - 分享链接
 * @property {() => void} onCancel - 取消回调
 */
interface ShareModalProps {
  visible: boolean;
  shareUrl: string;
  onCancel: () => void;
}

/**
 * 分享链接弹窗
 * @param {ShareModalProps} props
 */
const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  shareUrl,
  onCancel,
}) => {
  /**
   * 复制分享链接到剪贴板
   */
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

  /**
   * 在Electron环境中打开链接
   * @param {string} url - 要打开的链接
   */
  const openLinkInElectron = (url: string) => {
    // 检查是否在Electron环境中
    if (window.electron && window.electron.ipcRenderer) {
      try {
        // 通过IPC通信打开链接
        window.electron.ipcRenderer.send("open-external-link", url);
        message.success("正在打开链接...");

        // 监听打开链接的错误
        window.electron.ipcRenderer.on(
          "open-external-link-error",
          (event: any, data: any) => {
            if (data.url === url) {
              message.error(`打开链接失败: ${data.error}`);
            }
          }
        );
      } catch (error) {
        console.error("打开链接失败:", error);
        message.error("打开链接失败");
      }
    } else {
      // 在浏览器环境中直接打开
      window.open(url, "_blank");
    }
  };

  return (
    <Modal
      title="分享代码片段"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="copy" type="primary" onClick={copyShareUrl}>
          复制链接
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <div style={{ wordBreak: "break-all" }}>
        <Text>分享链接：</Text>
        <br />
        <div style={{ marginTop: 8 }}>
          <a
            href={shareUrl}
            onClick={(e) => {
              e.preventDefault();
              openLinkInElectron(shareUrl);
            }}
            style={{
              color: "#1677ff",
              textDecoration: "none",
              fontSize: 14,
              wordBreak: "break-all",
              display: "inline-block",
              maxWidth: "100%",
            }}
            title="点击在应用中打开链接"
          >
            {shareUrl}
          </a>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
          <Text>提示：点击链接可在应用中打开，或使用复制按钮复制链接</Text>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
