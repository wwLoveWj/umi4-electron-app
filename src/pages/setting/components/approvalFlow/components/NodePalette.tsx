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
  onDragStart: (
    type: ApprovalNodeType,
    name: string,
    e: React.DragEvent
  ) => void;
}

/**
 * 左侧节点面板组件
 */
const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [usedTypes, setUsedTypes] = React.useState<ApprovalNodeType[]>([]);

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.usedTypes) setUsedTypes(e.detail.usedTypes);
    };
    window.addEventListener("approval-flow-used-types", handler);
    return () =>
      window.removeEventListener("approval-flow-used-types", handler);
  }, []);

  return (
    <div className="node-palette">
      <div className="palette-title">节点面板</div>
      <div className="palette-list">
        {NODE_TYPES.map((type) => {
          const name = getNodeTypeName(type);
          const disabled =
            (type === ApprovalNodeType.START ||
              type === ApprovalNodeType.END) &&
            usedTypes.includes(type);
          return (
            <div
              key={type}
              className={`palette-item${disabled ? " palette-item-disabled" : ""}`}
              draggable={!disabled}
              onDragStart={
                disabled ? undefined : (e) => onDragStart(type, name, e)
              }
              style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              <span className="palette-icon">{getNodeIcon(type)}</span>
              <span className="palette-label">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodePalette;
