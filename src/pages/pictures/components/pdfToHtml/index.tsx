import React, { useRef, useState } from "react";
import { Button, message, Upload, Progress } from "antd";
import { InboxOutlined, FileOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import styles from "./style.less";

const { ipcRenderer, shell } = window.require("electron");
const path = window.require("path");

export default function Index() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // 监听进度更新事件
  React.useEffect(() => {
    const handleProgress = (event: any, data: { progress: number }) => {
      setProgress(data.progress);
    };

    ipcRenderer.on("pdf-to-html-progress", handleProgress);

    return () => {
      ipcRenderer.removeListener("pdf-to-html-progress", handleProgress);
    };
  }, []);

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "application/pdf"
      );
      if (files.length > 0) {
        await handleFiles(files);
      } else {
        message.warning("请拖拽 PDF 文件");
      }
    }
  };

  // 处理文件
  const handleFiles = async (files: File[]) => {
    try {
      if (!files || files.length === 0) {
        message.warning("请选择至少一个 PDF 文件");
        return;
      }

      setProcessing(true);
      setProgress(0);

      // 选择保存目录
      const savePath = await ipcRenderer.invoke("show-save-dialog", {
        title: "保存 HTML 文件",
        defaultPath: "转换文档.html",
        filters: [{ name: "HTML 文件", extensions: ["html"] }],
      });

      if (!savePath) {
        message.info("已取消保存");
        return;
      }

      // 将文件转换为 base64
      const pdfData = await Promise.all(
        files.map(async (file) => {
          if (!file || file.type !== "application/pdf") {
            throw new Error(`文件 ${file?.name || "未知"} 不是有效的 PDF 文件`);
          }
          const buffer = await file.arrayBuffer();
          return {
            name: file.name,
            data: Buffer.from(buffer).toString("base64"),
          };
        })
      );

      if (!pdfData || pdfData.length === 0) {
        throw new Error("没有有效的 PDF 数据");
      }

      // 转换 PDF 到 HTML
      const result = await ipcRenderer.invoke("convert-pdf-to-html", {
        pdfs: pdfData,
        savePath,
      });

      if (result.success) {
        message.success("文档转换成功");
        // 打开文件所在目录
        shell.showItemInFolder(savePath);
      } else {
        message.error(`转换失败: ${result.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("处理文件失败:", error);
      message.error(error instanceof Error ? error.message : "处理文件失败");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (info: any) => {
    try {
      if (!info || !info.fileList) {
        return;
      }

      const files = info.fileList
        .filter((file: UploadFile) => file && file.type === "application/pdf")
        .map((file: UploadFile) => file.originFileObj);

      if (files.length > 0) {
        await handleFiles(files);
      } else {
        message.warning("请选择有效的 PDF 文件");
      }
    } catch (error) {
      console.error("选择文件失败:", error);
      message.error("选择文件失败");
    } finally {
      setFileList([]);
    }
  };

  return (
    <div className={styles.pdfToHtmlBox}>
      <h3>PDF 转 HTML</h3>
      <div className={styles.buttonContainer}>
        <Upload
          accept=".pdf"
          multiple
          fileList={fileList}
          onChange={handleFileSelect}
          showUploadList={false}
          disabled={processing}
        >
          <Button type="primary" icon={<FileOutlined />} loading={processing}>
            选择 PDF
          </Button>
        </Upload>
      </div>
      {processing && (
        <div className={styles.progressContainer}>
          <Progress percent={progress} status="active" />
          <p className={styles.progressText}>正在转换文档...</p>
        </div>
      )}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ""} ${
          processing ? styles.disabled : ""
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <InboxOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
        <div className={styles.uploadText}>
          <p>拖拽 PDF 到此处</p>
          <p className={styles.uploadHint}>支持多个 PDF 文件</p>
          <FileOutlined
            style={{ fontSize: "24px", marginTop: "8px", color: "#1890ff" }}
          />
        </div>
      </div>
    </div>
  );
}
