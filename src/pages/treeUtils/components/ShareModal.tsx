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
        <Text copyable>{shareUrl}</Text>
      </div>
    </Modal>
  );
};

export default ShareModal;
