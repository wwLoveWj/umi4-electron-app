import React, { useState, useCallback } from "react";
import { Button, message } from "antd";
import {
  PlusOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import styles from "./style.less";
import { isImage } from "@/utils/index";
import JSZip from "jszip";
import dayjs from "dayjs";
const { ipcRenderer, shell } = window.require("electron");

interface SvgPreview {
  id: string;
  svg: string;
  fileName: string;
}

export default function index({
  svgWidth = 600,
  svgHeight = 400,
}: {
  svgWidth?: number;
  svgHeight?: number;
}) {
  const [downloadBtn, setDownloadBtn] = useState(true);
  const [containerSty, setContainerSty] = useState({});
  const [svgList, setSvgList] = useState<SvgPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 处理拖拽事件
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // 处理文件上传
  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const newSvgList: SvgPreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isImage(file)) {
        message.warning(`文件 ${file.name} 不是图片格式`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const result = e?.target?.result as string;
        const img = new Image();
        img.src = result;
        img.onload = function () {
          const width = svgWidth || img.width;
          const height = svgHeight || img.height;
          const svgString = `<svg id="downloadSvg_${i}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            width="${width}px" height="${height}px"
            viewBox="0 0 ${width} ${height}" enable-background="new 0 0 ${width} ${height}" xml:space="preserve">
            <image id="image0" width="${width}" height="${height}" x="0" y="0" href="${result}"></image>
          </svg>`;

          newSvgList.push({
            id: `svg_${i}`,
            svg: svgString,
            fileName: file.name,
          });

          if (newSvgList.length === files.length) {
            setSvgList(newSvgList);
            setDownloadBtn(false);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("multiple", "multiple");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async function (event: any) {
      if (event.target.files) {
        handleFiles(event.target.files);
      }
    };
    input.remove();
  };

  //下载功能
  function download(arg: string, fileName: string = "download.svg") {
    var blob = new Blob([arg], { type: "image/svg" });
    var href = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  }

  /**
   * 批量下载所有 SVG 为 zip 包
   */
  const downloadAll = async () => {
    if (svgList.length === 0) {
      message.warning("没有可下载的 SVG 文件");
      return;
    }

    try {
      const zip = new JSZip();

      // 添加所有 SVG 文件到 zip
      svgList.forEach((item) => {
        zip.file(`${item.fileName}.svg`, item.svg);
      });

      // 生成 zip 文件
      const content = await zip.generateAsync({ type: "blob" });

      // 生成带时间戳的文件名
      const timestamp = dayjs().format("YYYYMMDD_HHmmss");
      const fileName = `svg_files_${timestamp}.zip`;

      // 打开保存对话框
      const savePath = await ipcRenderer.invoke("show-save-dialog", {
        title: "保存 SVG 文件",
        defaultPath: fileName,
        filters: [{ name: "ZIP 文件", extensions: ["zip"] }],
      });

      if (savePath) {
        // 保存文件
        await ipcRenderer.invoke("save-file", {
          content: await content.arrayBuffer(),
          path: savePath,
        });

        // 打开文件所在文件夹
        shell.showItemInFolder(savePath);
        message.success("SVG 文件已打包保存，正在打开所在文件夹");
      }
    } catch (error) {
      console.error("打包保存失败:", error);
      message.error("打包保存失败，请重试");
    }
  };

  const clearAll = () => {
    setDownloadBtn(true);
    setContainerSty({});
    setSvgList([]);
  };

  return (
    <div className={styles.pngToSvgBox}>
      <h3>PNG 转 SVG 工具</h3>
      <div style={{ marginTop: "12px" }}>
        <Button
          style={{ marginRight: "12px" }}
          disabled={downloadBtn}
          onClick={() => {
            if (svgList.length > 0) {
              download(svgList[0].svg, `${svgList[0].fileName}.svg`);
            }
          }}
        >
          下载单个svg
        </Button>
        <Button type="primary" disabled={downloadBtn} onClick={downloadAll}>
          批量下载svg
        </Button>
      </div>
      <div className={styles.container} style={containerSty}>
        <div className={styles.previewContainer}>
          {downloadBtn ? (
            <div className={styles.emptyState}>
              <PictureOutlined
                style={{
                  fontSize: "48px",
                  color: "#bfbfbf",
                  marginBottom: "16px",
                }}
              />
              <p>暂无转换后的图片</p>
              <p className={styles.emptyHint}>请在下方上传图片进行转换</p>
            </div>
          ) : (
            svgList.map((item) => (
              <div key={item.id} className={styles.svgPreview}>
                <div className={styles.svgFileName}>{item.fileName}</div>
                <div dangerouslySetInnerHTML={{ __html: item.svg }} />
              </div>
            ))
          )}
        </div>
        <span
          className={styles.clearImg}
          onClick={clearAll}
          style={!downloadBtn ? { display: "block" } : { display: "none" }}
        >
          <CloseCircleOutlined />
        </span>
      </div>
      <div>
        {downloadBtn && (
          <div
            className={`${styles.fileUploadContent} ${
              isDragging ? styles.dragging : ""
            }`}
            onClick={uploadImage}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <InboxOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
            <div className={styles.uploadText}>
              <p>点击或拖拽图片到此处</p>
              <p className={styles.uploadHint}>支持多个图片文件</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
