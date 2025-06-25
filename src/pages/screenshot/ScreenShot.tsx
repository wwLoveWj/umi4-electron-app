import React, { useCallback, useEffect, useState } from "react";
import Screenshots, { Bounds } from "react-screenshots";
const { ipcRenderer } = window.require("electron");
import "react-screenshots/lib/style.css";

export default function ShotScreen() {
  const [screenShotImg, setScreenShotImg] = useState("");

  useEffect(() => {
    getShotScreenImg();
    /**
     * 监听键盘事件，按下ESC时退出截图
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ipcRenderer.send("ss:close-win");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function getShotScreenImg() {
    const img = await ipcRenderer.invoke("ss:get-shot-screen-img");
    setScreenShotImg(img);
    return img;
  }

  const onSave = useCallback((blob: Blob, bounds: Bounds) => {
    const downloadUrl = URL.createObjectURL(blob);
    ipcRenderer.send("ss:download-img", downloadUrl);
  }, []);

  const onCancel = useCallback(() => {
    ipcRenderer.send("ss:close-win");
  }, []);

  const onOk = useCallback((blob: Blob, bounds: Bounds) => {
    const downloadUrl = URL.createObjectURL(blob);
    ipcRenderer.send("ss:save-img", downloadUrl);
  }, []);

  return (
    <Screenshots
      url={screenShotImg}
      width={window.innerWidth}
      height={window.innerHeight}
      onSave={onSave}
      onCancel={onCancel}
      onOk={onOk}
    />
  );
}
