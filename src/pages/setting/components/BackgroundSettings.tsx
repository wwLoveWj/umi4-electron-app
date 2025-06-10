import React, { useState, useEffect } from "react";
import {
  Upload,
  message,
  Button,
  Image,
  Card,
  Row,
  Col,
  Popconfirm,
} from "antd";
import {
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/lib/upload/interface";
import "./BackgroundSettings.less";
const { ipcRenderer } = window.require("electron");

interface BackgroundImage {
  path: string;
  isActive: boolean;
}

export default function BackgroundSettings() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<BackgroundImage[]>([]);
  const [currentBgPath, setCurrentBgPath] = useState("@/assets/bg.png");

  useEffect(() => {
    fetchBackgroundImages();
  }, []);

  const fetchBackgroundImages = async () => {
    const result = await ipcRenderer.invoke("get-background-images");
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
    multiple: true,
    accept: "image/*",
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("请选择要上传的图片！");
      return;
    }

    let successCount = 0;
    let lastUploadedPath = "";

    for (const file of fileList) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file as any);

      await new Promise<void>((resolve) => {
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
              successCount++;
              lastUploadedPath = result.filePath;
            } else {
              message.error(`图片 '${file.name}' 上传失败: ${result.error}`);
            }
          } catch (error: any) {
            console.error("上传处理失败:", error);
            message.error(`图片 '${file.name}' 上传处理失败: ${error.message}`);
          } finally {
            resolve();
          }
        };
        reader.onerror = (error) => {
          message.error(
            `文件 '${file.name}' 读取失败: ${(error as any).message || error}`
          );
          resolve();
        };
      });
    }

    if (successCount > 0) {
      message.success(`成功上传 ${successCount} 张图片！`);
      fetchBackgroundImages();

      if (lastUploadedPath) {
        handleSetBackground(lastUploadedPath, false);
      }
      //   message.info("新的背景图片已上传，请重启应用以完全生效。");
    } else {
      message.error("所有图片上传失败。");
    }
    setFileList([]);
  };

  const handleSetBackground = async (
    imagePath: string,
    isShowSuccMsg = true
  ) => {
    const result = await ipcRenderer.invoke("set-active-background-image", {
      imagePath,
    });
    if (result.success) {
      if (isShowSuccMsg) {
        message.success("背景图片设置成功，请重启应用以完全生效！");
      }
      setCurrentBgPath(imagePath);
      setUploadedImages((prevImages) =>
        prevImages.map((img) => ({ ...img, isActive: img.path === imagePath }))
      );
    } else {
      message.error(`设置背景图片失败: ${result.error}`);
    }
  };

  const handleDeleteBackground = async (
    imagePath: string,
    fileName: string
  ) => {
    try {
      const result = await ipcRenderer.invoke("delete-background-image", {
        imagePath,
      });
      if (result.success) {
        message.success(`图片 '${fileName}' 删除成功！`);
        fetchBackgroundImages();
        if (imagePath === currentBgPath) {
          setCurrentBgPath("");
          message.info(
            "当前背景图片已被删除，系统背景可能需要重启应用以更新。"
          );
        }
      } else {
        message.error(`图片 '${fileName}' 删除失败: ${result.error}`);
      }
    } catch (error: any) {
      console.error("删除处理失败:", error);
      message.error(`删除处理失败: ${error.message}`);
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
                style={{ position: "relative" }}
                className="card-with-delete"
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
                    {!image.isActive && (
                      <span
                        onClick={() =>
                          handleDeleteBackground(
                            image.path,
                            image.path.split("/").pop() || ""
                          )
                        }
                        style={{
                          position: "absolute",
                          top: "-10px",
                          right: "-10px",
                          zIndex: 1,
                        }}
                        className="delete-icon"
                      >
                        <CloseCircleOutlined
                          style={{
                            fontSize: "24px",
                            color: "rgba(255, 0, 0, 0.8)",
                          }}
                        />
                      </span>
                    )}
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
