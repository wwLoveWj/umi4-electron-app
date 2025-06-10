import React, { useState } from "react";
import { Upload, message, Button, Image } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib/upload/interface";
const { ipcRenderer } = window.require("electron");

export default function BackgroundSettings() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentBg, setCurrentBg] = useState("");

  // 加载当前背景图片路径 (如果需要，可以通过IPC从主进程获取)
  // 例如，可以在组件挂载时从主进程获取当前配置的背景图路径
  // useEffect(() => {
  //   ipcRenderer.invoke('get-current-background').then(path => {
  //     if (path) setCurrentBg(path);
  //   });
  // }, []);

  const props = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: UploadFile) => {
      setFileList([...fileList, file]);
      return false; // Prevent default upload behavior
    },
    fileList,
    maxCount: 1,
    accept: "image/*",
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("请选择要上传的图片！");
      return;
    }

    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file as any);

    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error("文件读取失败，结果为空。");
        }
        // 将 ArrayBuffer 转换为 Buffer
        const buffer = Buffer.from(e.target.result as ArrayBuffer);
        const base64Image = buffer.toString("base64");

        // 调用主进程保存图片
        const result = await ipcRenderer.invoke("save-background-image", {
          imageData: base64Image,
          fileName: "bg.png", // 固定文件名
        });

        if (result.success) {
          message.success("背景图片上传成功！");
          setCurrentBg(
            `data:${
              file.originFileObj?.type || file.type
            };base64,${base64Image}`
          );
          // 提示用户需要重启应用才能看到新背景
          message.info("新的背景图片将在应用重启后生效。");
        } else {
          message.error(`背景图片上传失败: ${result.error}`);
        }
      } catch (error: any) {
        console.error("上传处理失败:", error);
        message.error(`上传处理失败: ${error.message}`);
      }
    };
    reader.onerror = (error) => {
      message.error(`文件读取失败: ${(error as any).message || error}`);
    };
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3>背景图片设置</h3>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>选择图片</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        style={{ marginTop: 16 }}
      >
        上传并保存
      </Button>
      {currentBg && (
        <div style={{ marginTop: 20 }}>
          <h4>当前背景预览:</h4>
          <Image
            src={currentBg}
            style={{
              maxWidth: "300px",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}
