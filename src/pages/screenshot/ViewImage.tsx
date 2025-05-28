import React, { useEffect, useState } from "react";
import { useLocation } from "umi";
const { ipcRenderer } = window.require("electron");
import "./index.less";
import { ScanOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

const ViewImage: React.FC = () => {
  const location = useLocation();
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const url = params.get("path");
    if (url) {
      setImageUrl(decodeURIComponent(url));
    }
  }, [location]);

  const handleClose = () => {
    ipcRenderer.send("CLOSE_VIEW_IMAGE");
  };

  return (
    <div className="view-image-container">
      <div className="view-image-header">
        <button onClick={handleClose}>关闭</button>
        <Tooltip placement="topLeft" title={"识别文字"}>
          <span onClick={() => ipcRenderer.send("ss:identify-img")}>
            <ScanOutlined />
          </span>
        </Tooltip>
      </div>
      <div className="view-image-content">
        {imageUrl && <img src={imageUrl} alt="预览图片" />}
      </div>
    </div>
  );
};

export default ViewImage;
