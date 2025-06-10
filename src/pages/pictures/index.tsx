import React from "react";
import { Tabs } from "antd";
import {
  FileZipOutlined,
  PictureOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileOutlined,
} from "@ant-design/icons";
import PngToSvg from "./components/pngToSvg";
import UnZipFile from "./components/unzipFile";
import ImgToWord from "./components/imgToWord";
import PdfToWord from "./components/pdfToWord";
import PdfToHtml from "./components/pdfToHtml";

export default function Index() {
  return (
    <div style={{ padding: "24px" }}>
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: (
              <span>
                <FileZipOutlined />
                ZIP 解压
              </span>
            ),
            children: <UnZipFile />,
          },
          {
            key: "2",
            label: (
              <span>
                <PictureOutlined />
                PNG 转 SVG
              </span>
            ),
            children: <PngToSvg />,
          },
          {
            key: "3",
            label: (
              <span>
                <FileWordOutlined />
                图片转 Word
              </span>
            ),
            children: <ImgToWord />,
          },
          {
            key: "4",
            label: (
              <span>
                <FilePdfOutlined />
                PDF 转 Word
              </span>
            ),
            children: <PdfToWord />,
          },
          {
            key: "5",
            label: (
              <span>
                <FileOutlined />
                PDF 转 HTML
              </span>
            ),
            children: <PdfToHtml />,
          },
        ]}
      />
    </div>
  );
}
