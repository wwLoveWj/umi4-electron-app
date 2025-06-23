import React from "react";
import { ApprovalNodeType } from "./types";
import { getNodeTypeName, getNodeIcon } from "./utils";
import "./NodePalette.css";

const NODE_TYPES = [
  ApprovalNodeType.START,
  ApprovalNodeType.APPROVER,
  ApprovalNodeType.CONDITION,
  ApprovalNodeType.PARALLEL,
  ApprovalNodeType.AUTO,
  ApprovalNodeType.EMAIL,
  ApprovalNodeType.END,
];

interface NodePaletteProps {
  onDragStart: (type: ApprovalNodeType, e: React.DragEvent) => void;
}

/**
 * 左侧节点面板组件
 */
const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  return (
    <div className="node-palette">
      <div className="palette-title">节点面板</div>
      <div className="palette-list">
        {NODE_TYPES.map((type) => (
          <div
            key={type}
            className="palette-item"
            draggable
            onDragStart={(e) => onDragStart(type, e)}
          >
            <span className="palette-icon">{getNodeIcon(type)}</span>
            <span className="palette-label">{getNodeTypeName(type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
