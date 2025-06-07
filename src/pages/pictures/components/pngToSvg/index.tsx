import React, { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./style.less";
import { isImage } from "@/utils/index";
import JSZip from "jszip";

export default function index({
  svgWidth = 600,
  svgHeight = 400,
}: {
  svgWidth?: number;
  svgHeight?: number;
}) {
  const [downloadBtn, setDownloadBtn] = useState(true);
  const [containerSty, setContainerSty] = useState({});
  const [svgList, setSvgList] = useState<{ id: string; svg: string }[]>([]);

  // 返回文件(图片的宽和高)
  function getImageWH(file: any, callback: (w: number, h: number) => void) {
    // 创建一个FileReader实例
    const reader = new FileReader();
    // 当文件读取完成时触发
    reader.onload = function (e) {
      // e 这个对象中包含这个图片相关的属性
      let result = e?.target?.result as string;
      // 创建一个新的Image对象
      const img = new Image();
      // 设置Image的src为读取到的文件内容
      img.src = result;
      // 当图片加载时触发
      img.onload = function () {
        // 调用回调函数，并传入图片的宽高
        callback(img.width, img.height);
        let width = svgWidth || img.width;
        let height = svgHeight || img.height;
        let dataURL = result;
        //svg 的dom节点(字符串)
        var svgString = `<svg id="downloadSvg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="${width}px" height="${height}px"
    viewBox="0 0 ${width} ${height}" enable-background="new 0 0 ${width} ${height}" xml:space="preserve">
        <image id="image0" width="${width}" height="${height}" x="0" y="0" href="${dataURL}"></image>
    </svg>`;
        let contanier = document.getElementById("container") as HTMLDivElement;
        //把svg插入到页面中
        // $("#container").append(svgString);
        contanier.innerHTML = svgString;
        setDownloadBtn(false);
      };
    };
    // 开始读取文件内容，以DataURL的形式
    // reader.onload 方法的执行需要调用下面这个 reader.readAsDataURL
    if (file) reader.readAsDataURL(file);
  }

  // 读取文件,然后返回宽度和高度
  function readFile(file: any) {
    getImageWH(file, function (width: number, height: number) {
      console.log("Width:", width, "Height:", height);
      setContainerSty({
        width: svgWidth || width,
        height: svgHeight || height,
      });
    });
  }

  //下载功能
  function download(arg: any, fileName: string = "download.svg") {
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
      svgList.forEach((item, index) => {
        zip.file(`svg_${index + 1}.svg`, item.svg);
      });

      // 生成 zip 文件
      const content = await zip.generateAsync({ type: "blob" });

      // 下载 zip 文件
      const href = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = href;
      a.download = "svg_files.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);

      message.success("SVG 文件已打包下载");
    } catch (error) {
      console.error("打包下载失败:", error);
      message.error("打包下载失败，请重试");
    }
  };

  /**
   * 图片上传的方法
   */
  const uploadImage = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("multiple", "multiple");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async function (event: any) {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newSvgList: { id: string; svg: string }[] = [];

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

            newSvgList.push({ id: `svg_${i}`, svg: svgString });
            if (newSvgList.length === files.length) {
              setSvgList(newSvgList);
              setDownloadBtn(false);
            }
          };
        };
        reader.readAsDataURL(file);
      }
    };
    input.remove();
  };

  return (
    <div className={styles.pngToSvgBox}>
      <h3>转换后的svg图片：</h3>
      <div style={{ marginTop: "12px" }}>
        <Button
          style={{ marginRight: "12px" }}
          disabled={downloadBtn}
          onClick={() => {
            let svgDom = document.querySelector("#downloadSvg");
            if (svgDom) {
              download(svgDom.outerHTML);
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
        <div id="container"></div>
        <span
          className={styles.clearImg}
          onClick={() => {
            setDownloadBtn(true);
            let contanier = document.getElementById(
              "container"
            ) as HTMLDivElement;
            contanier.innerHTML = "";
            setContainerSty({});
            setSvgList([]);
          }}
          style={!downloadBtn ? { display: "block" } : { display: "none" }}
        >
          <CloseCircleOutlined />
        </span>
      </div>
      <div>
        {downloadBtn && (
          <div className={styles.fileUploadContent} onClick={uploadImage}>
            <PlusOutlined />
          </div>
        )}
      </div>
    </div>
  );
}
