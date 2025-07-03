import React from "react";
import "./WindowControls.less";
const { ipcRenderer } = window.require("electron");
/**
 * 自定义窗口控制按钮组件
 */
const WindowControls: React.FC = () => {
  return (
    <div className="window-controls">
      <div
        className="window-btn min"
        title="最小化"
        onClick={() => ipcRenderer && ipcRenderer.invoke("window-minimize")}
      />
      <div
        className="window-btn max"
        title="最大化/还原"
        onClick={() => ipcRenderer && ipcRenderer.invoke("window-maximize")}
      />
      <div
        className="window-btn close"
        title="关闭"
        onClick={() => ipcRenderer && ipcRenderer.invoke("window-close")}
      />
    </div>
  );
};

export default WindowControls;
