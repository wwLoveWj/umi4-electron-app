import React from "react";
import { Tabs } from "antd";
import {
  FileZipOutlined,
  PictureOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import PngToSvg from "./components/pngToSvg";
import UnZipFile from "./components/unzipFile";
import ImgToWord from "./components/imgToWord";

export default function Index() {
  return (
    <div style={{ padding: "24px" }}>
      <Tabs
        defaultActiveKey="unzip"
        items={[
          {
            key: "unzip",
            label: (
              <span>
                <FileZipOutlined />
                ZIP 解压
              </span>
            ),
            children: <UnZipFile />,
          },
          {
            key: "png2svg",
            label: (
              <span>
                <PictureOutlined />
                PNG 转 SVG
              </span>
            ),
            children: <PngToSvg />,
          },
          {
            key: "img2word",
            label: (
              <span>
                <FileWordOutlined />
                图片转 Word
              </span>
            ),
            children: <ImgToWord />,
          },
        ]}
      />
    </div>
  );
}
