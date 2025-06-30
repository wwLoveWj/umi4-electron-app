import React, { useEffect, useState } from "react";
import { ApprovalNodeType } from "./types";
import { getNodeTypeName, getNodeIcon } from "./utils";
import "./NodePalette.css";

const LOCAL_KEY = "customNodeTypes";
const PRESET_NODES = [
  { type: "start", name: "发起人", icon: "🚀" },
  { type: "approver", name: "审批人", icon: "👤" },
  { type: "condition", name: "条件分支", icon: "🔀" },
  { type: "parallel", name: "并行审批", icon: "⚡" },
  { type: "auto", name: "自动审批", icon: "🤖" },
  { type: "email", name: "邮件催办", icon: "📧" },
  { type: "end", name: "结束节点", icon: "🏁" },
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
  const [usedTypes, setUsedTypes] = useState<ApprovalNodeType[]>([]);
  const [nodeTypes, setNodeTypes] = useState<any[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.usedTypes) setUsedTypes(e.detail.usedTypes);
    };
    window.addEventListener("approval-flow-used-types", handler);
    return () =>
      window.removeEventListener("approval-flow-used-types", handler);
  }, []);

  // 自动同步系统设置的节点类型
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    const custom = saved ? JSON.parse(saved) : [];
    // 合并预设和自定义，预设可被覆盖
    const merged = [
      ...PRESET_NODES.map((preset) => {
        const local = custom.find((d: any) => d.type === preset.type);
        return local ? { ...preset, ...local } : preset;
      }),
      ...custom.filter(
        (d: any) => !PRESET_NODES.some((p) => p.type === d.type)
      ),
    ];
    setNodeTypes(merged);
  }, []);

  return (
    <div className="node-palette">
      <div className="palette-title">节点面板</div>
      <div className="palette-list">
        {nodeTypes.map((item) => {
          const type = item.type;
          const name = item.name;
          const icon = item.icon;
          const disabled =
            (type === "start" || type === "end") && usedTypes.includes(type);
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
              <span className="palette-icon">{icon}</span>
              <span className="palette-label">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodePalette;
