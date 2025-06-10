import React, { useState, useEffect } from "react";
import { Upload, message, Button, Image, Card, Row, Col } from "antd";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib/upload/interface";
const { ipcRenderer } = window.require("electron");

interface BackgroundImage {
  path: string;
  isActive: boolean;
}

export default function BackgroundSettings() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<BackgroundImage[]>([]);
  const [currentBgPath, setCurrentBgPath] = useState("assets/bg.png");

  useEffect(() => {
    fetchBackgroundImages();
  }, []);

  const fetchBackgroundImages = async () => {
    const result = await ipcRenderer.invoke("get-background-images");
    debugger;
    if (result.success) {
      const images: BackgroundImage[] = result.images.map(
        (imagePath: string) => ({
          path: imagePath,
          isActive: imagePath === currentBgPath,
        })
      );
      setUploadedImages(images);
    } else {
      message.error(`获取背景图片列表失败: ${result.error}`);
    }
  };

  const props = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: UploadFile) => {
      setFileList([...fileList, file]);
      return false;
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
        const buffer = Buffer.from(e.target.result as ArrayBuffer);
        const base64Image = buffer.toString("base64");

        const result = await ipcRenderer.invoke("save-background-image", {
          imageData: base64Image,
          fileName: file.name,
        });

        if (result.success) {
          message.success("背景图片上传成功！");
          fetchBackgroundImages();
          setCurrentBgPath(result.filePath);
          message.info("新的背景图片已上传，请重启应用以完全生效。");
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

  const handleSetBackground = async (imagePath: string) => {
    const result = await ipcRenderer.invoke("set-active-background-image", {
      imagePath,
    });
    if (result.success) {
      message.success("背景图片设置成功，请重启应用以完全生效！");
      setCurrentBgPath(imagePath);
      setUploadedImages((prevImages) =>
        prevImages.map((img) => ({ ...img, isActive: img.path === imagePath }))
      );
    } else {
      message.error(`设置背景图片失败: ${result.error}`);
    }
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
        style={{ marginTop: 16, marginRight: 10 }}
      >
        上传并保存
      </Button>

      <h4 style={{ marginTop: 30, marginBottom: 15 }}>已上传背景图片:</h4>
      {uploadedImages.length === 0 ? (
        <p>暂无已上传的背景图片。</p>
      ) : (
        <Row gutter={[16, 16]}>
          {uploadedImages.map((image) => (
            <Col xs={24} sm={12} md={8} lg={6} key={image.path}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      height: 150,
                      overflow: "hidden",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      alt="背景图片"
                      src={image.path}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                    />
                  </div>
                }
                actions={[
                  <Button
                    type={image.isActive ? "primary" : "default"}
                    icon={image.isActive ? <CheckCircleOutlined /> : null}
                    onClick={() => handleSetBackground(image.path)}
                    disabled={image.isActive}
                  >
                    {image.isActive ? "当前背景" : "设为背景"}
                  </Button>,
                ]}
              >
                <Card.Meta title={image.path.split("/").pop()} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
