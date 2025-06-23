import React from "react";

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onDelete: () => void;
}

/**
 * 右键菜单组件
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  onDelete,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: 100,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{ padding: "8px 16px", color: "#ff4d4f", cursor: "pointer" }}
        onClick={onDelete}
      >
        删除节点
      </div>
    </div>
  );
};

export default ContextMenu;
