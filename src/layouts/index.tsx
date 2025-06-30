import React, { PropsWithChildren, useState, useEffect } from "react";
import { Outlet, history, useLocation } from "umi";
import { FloatButton, Modal, message } from "antd";
import {
  ToolOutlined,
  SyncOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import WindowControls from "@/components/WindowControls";
import ChatBotFloat, { ChatBotFloatButton } from "@/pages/ChatBot";
const { ipcRenderer } = window.require("electron");
import { routes } from "@/routes/index";
import styles from "./style.less";
import { useMemo } from "react";
import Draggable from "react-draggable";

const FAB_POSITION_KEY = "fabPosition";

const Layout: React.FC<PropsWithChildren> = () => {
  const { pathname } = useLocation();
  const routesMap = useMemo(() => {
    const pathList = routes?.find((item) => item.path === "/")?.routes;
    return pathList?.filter((item) => item?.path !== "/" && !item?.hidden);
  }, [routes]);
  const currentTitle = useMemo(() => {
    return (
      routesMap?.find((item) => item.path === pathname)?.title || "未知页面"
    );
  }, [pathname]);

  // 拖拽位置状态，刷新后记忆
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  useEffect(() => {
    const saved = localStorage.getItem(FAB_POSITION_KEY);
    if (saved) {
      try {
        setFabPosition(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleDragStop = (_: any, data: any) => {
    setFabPosition({ x: data.x, y: data.y });
    localStorage.setItem(
      FAB_POSITION_KEY,
      JSON.stringify({ x: data.x, y: data.y })
    );
  };

  /**
   * 直接强制刷新页面
   */
  const handleRefresh = () => {
    // 软刷新
    // history.replace(pathname);
    // setTimeout(() => {
    //   window.dispatchEvent(new Event("popstate"));
    // }, 100);
    // 硬刷新
    window.location.reload();
  };

  // 智能问答弹窗显示状态
  const [chatBotVisible, setChatBotVisible] = useState(false);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {["/album/view-image", "/album/screenshot", "/login"]?.includes(
        pathname
      ) || pathname?.startsWith("/share/") ? (
        <div className={styles?.wwLayout}>
          <Outlet />
        </div>
      ) : (
        <div className={styles?.wwLayout}>
          <WindowControls />
          {chatBotVisible && (
            <ChatBotFloat
              visible={chatBotVisible}
              setVisible={setChatBotVisible}
            />
          )}
          <ul className={styles?.leftLayout}>
            {routesMap?.map((item) => (
              <li
                key={item?.path}
                onClick={() => history.push(item?.path)}
                title={item?.title}
                className={item.path === pathname ? styles?.activeMenu : ""}
              >
                {item.icon}
              </li>
            ))}
          </ul>
          <div className={styles?.rightLayout}>
            {/* 首页右下角悬浮操作组，可拖拽 */}
            <Draggable
              bounds="parent"
              position={fabPosition}
              onStop={handleDragStop}
            >
              <div
                style={{
                  position: "fixed",
                  right: 12,
                  bottom: 12,
                  zIndex: 9999,
                }}
              >
                <FloatButton.Group
                  trigger="click"
                  type="primary"
                  icon={<QuestionCircleOutlined />}
                >
                  <FloatButton
                    icon={<SyncOutlined />}
                    tooltip={{
                      title: "刷新页面",
                      color: "blue",
                      placement: "left",
                    }}
                    onClick={handleRefresh}
                  />
                  <ChatBotFloatButton onClick={() => setChatBotVisible(true)} />
                  <FloatButton
                    icon={<ToolOutlined />}
                    tooltip={{
                      title: "打开控制台",
                      color: "blue",
                      placement: "left",
                    }}
                    onClick={() => ipcRenderer.send("SET_CONSOLE")}
                  />
                </FloatButton.Group>
              </div>
            </Draggable>
            <h3 style={{ color: "#fff", marginBottom: "15px" }}>
              {currentTitle}
            </h3>
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
