import React from "react";

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onDelete: () => void;
  onNodeSelect: (node: any) => void;
  onClose: () => void;
}

/**
 * 右键菜单组件
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  onDelete,
  onNodeSelect,
  onClose,
}) => {
  if (!visible) return null;

  const handleDelete = () => {
    onDelete && onDelete();
    onNodeSelect && onNodeSelect(null);
    onClose && onClose();
  };

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
        onClick={handleDelete}
      >
        删除节点
      </div>
    </div>
  );
};

export default ContextMenu;
