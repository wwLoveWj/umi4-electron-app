import React, { useRef, useState } from "react";
import { Button, message, Upload } from "antd";
import { InboxOutlined, FileWordOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import styles from "./style.less";
const { ipcRenderer, shell } = window.require("electron");
const path = window.require("path");

export default function Index() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length > 0) {
        await handleFiles(files);
      } else {
        message.warning("请拖拽图片文件");
      }
    }
  };

  // 处理文件
  const handleFiles = async (files: File[]) => {
    try {
      // 选择保存目录
      const savePath = await ipcRenderer.invoke("show-save-dialog", {
        title: "保存 Word 文档",
        defaultPath: "图片文档.docx",
        filters: [{ name: "Word 文档", extensions: ["docx"] }],
      });

      if (savePath) {
        // 将文件转换为 base64
        const imageData = await Promise.all(
          files.map(async (file) => {
            const buffer = await file.arrayBuffer();
            return {
              name: file.name,
              data: Buffer.from(buffer).toString("base64"),
            };
          })
        );

        // 生成 Word 文档
        const result = await ipcRenderer.invoke("create-word-doc", {
          images: imageData,
          savePath,
        });

        if (result.success) {
          message.success("文档生成成功");
          // 打开文件所在目录
          shell.showItemInFolder(savePath);
        } else {
          message.error(`生成失败: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("处理文件失败:", error);
      message.error("处理文件失败");
    }
  };

  // 处理文件选择
  const handleFileSelect = async (info: any) => {
    const files = info.fileList
      .filter((file: UploadFile) => file.type?.startsWith("image/"))
      .map((file: UploadFile) => file.originFileObj);

    if (files.length > 0) {
      await handleFiles(files);
    }
    setFileList([]);
  };

  return (
    <div className={styles.imgToWordBox}>
      <h3>图片转 Word 文档</h3>
      <div className={styles.buttonContainer}>
        <Upload
          accept="image/*"
          multiple
          fileList={fileList}
          onChange={handleFileSelect}
          showUploadList={false}
        >
          <Button type="primary" icon={<FileWordOutlined />}>
            选择图片
          </Button>
        </Upload>
      </div>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <InboxOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
        <div className={styles.uploadText}>
          <p>拖拽图片到此处</p>
          <p className={styles.uploadHint}>支持多个图片文件</p>
          <FileWordOutlined
            style={{ fontSize: "24px", marginTop: "8px", color: "#1890ff" }}
          />
        </div>
      </div>
    </div>
  );
}
