import React, { useRef } from "react";
import { Button, message } from "antd";
import { FileZipOutlined, InboxOutlined } from "@ant-design/icons";
import styles from "./style.less";
const { ipcRenderer, shell, app } = window.require("electron");
const path = window.require("path");

export default function Index() {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

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
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".zip")) {
        await handleZipFile(file);
      } else {
        message.warning("请拖拽 ZIP 文件");
      }
    }
  };

  // 处理 zip 文件
  const handleZipFile = async (file: File) => {
    try {
      // 选择解压目录
      const extractPath = await ipcRenderer.invoke("show-open-dialog", {
        properties: ["openDirectory"],
        title: "选择解压目录",
      });

      if (extractPath && extractPath.length > 0) {
        // 将文件保存到临时目录
        const tempPath = await ipcRenderer.invoke("save-file", {
          content: await file.arrayBuffer(),
          path: path.join(
            await ipcRenderer.invoke("get-downloads-path", {
              filename: "temp",
            }),
            file.name
          ),
        });

        if (tempPath) {
          // 解压文件
          const result = await ipcRenderer.invoke("extract-zip", {
            zipPath: tempPath,
            extractPath: extractPath[0],
          });

          if (result.success) {
            message.success("文件解压成功");
            // 打开解压目录
            shell.openPath(extractPath[0]);
          } else {
            message.error(`解压失败: ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error("处理 zip 文件失败:", error);
      message.error("处理 zip 文件失败");
    }
  };

  // 处理 zip 文件选择
  const handleZipSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith(".zip")) {
      await handleZipFile(file);
    }
    // 重置 input 值，以便可以重复选择同一个文件
    if (zipInputRef.current) {
      zipInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.unzipBox}>
      <h3>ZIP 文件解压工具</h3>
      <div className={styles.buttonContainer}>
        <Button
          type="primary"
          icon={<FileZipOutlined />}
          onClick={() => zipInputRef.current?.click()}
        >
          选择 ZIP 文件
        </Button>
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={handleZipSelect}
        />
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
          <p>拖拽 ZIP 文件到此处</p>
          <p className={styles.uploadHint}>支持单个 ZIP 文件</p>
          <FileZipOutlined
            style={{ fontSize: "24px", marginTop: "8px", color: "#1890ff" }}
          />
        </div>
      </div>
    </div>
  );
}
