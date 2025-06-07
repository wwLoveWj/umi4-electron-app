import { Outlet, history, useLocation } from "umi";
import { FloatButton } from "antd";
import { ToolOutlined } from "@ant-design/icons";
const { ipcRenderer } = window.require("electron");
import { routes } from "@/routes/index";
import styles from "./style.less";
import { useMemo } from "react";
export default function Layout() {
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
  return (
    <div className={styles?.wwLayout}>
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
        <h3>{currentTitle}</h3>
        <Outlet />
      </div>
    </div>
  );
}
