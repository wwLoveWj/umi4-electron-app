import { Outlet } from "umi";
import { FloatButton } from "antd";
import { ToolOutlined } from "@ant-design/icons";
const { ipcRenderer } = window.require("electron");
export default function Layout() {
  return (
    <div style={{ margin: "0 12px", boxSizing: "border-box" }}>
      <FloatButton
        style={{ insetBlockEnd: 108 }}
        icon={<ToolOutlined />}
        tooltip={{
          title: "打开控制台",
          color: "blue",
          placement: "top",
        }}
        onClick={() => {
          ipcRenderer.send("SET_CONSOLE");
        }}
      />
      <Outlet />
    </div>
  );
}
