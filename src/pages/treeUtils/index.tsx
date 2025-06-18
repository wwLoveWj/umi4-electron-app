/**
 * @file 代码粘贴工具
 */
import React, { useState } from "react";
import { Tree, Card, Button, message, Space, Typography } from "antd";
import type { DataNode } from "antd/es/tree";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CodeNode extends DataNode {
  code?: string;
  children?: CodeNode[];
}

const CodeTree: React.FC = () => {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  // 示例代码数据
  const treeData: CodeNode[] = [
    {
      title: "位置监控工具",
      key: "location",
      children: [
        {
          title: "获取位置",
          key: "getLocation",
          code: `const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
};`,
        },
        {
          title: "计算距离",
          key: "calculateDistance",
          code: `const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};`,
        },
      ],
    },
    {
      title: "地图工具",
      key: "map",
      children: [
        {
          title: "初始化地图",
          key: "initMap",
          code: `const initMap = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = \`https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY\`;
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = (error) => {
      reject(error);
    };

    document.head.appendChild(script);
  });
};`,
        },
        {
          title: "绘制圆形",
          key: "drawCircle",
          code: `const drawCircle = (map: any, center: Location, radius: number) => {
  const circle = new window.AMap.Circle({
    center: [center.longitude, center.latitude],
    radius: radius,
    strokeColor: "#FF0000",
    strokeWeight: 2,
    strokeOpacity: 0.8,
    fillColor: "#FF0000",
    fillOpacity: 0.2,
  });

  circle.setMap(map);
  return circle;
};`,
        },
      ],
    },
  ];

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const node = info.node as CodeNode;
    if (node.code) {
      setSelectedCode(node.code);
      setSelectedTitle(node.title as string);
    }
  };

  const handleCopy = () => {
    if (selectedCode) {
      navigator.clipboard.writeText(selectedCode).then(
        () => {
          message.success("代码已复制到剪贴板");
        },
        () => {
          message.error("复制失败，请手动复制");
        }
      );
    }
  };

  return (
    <div style={{ display: "flex", gap: "16px", padding: "16px" }}>
      <Card title="代码列表" style={{ width: "300px", overflow: "auto" }}>
        <Tree treeData={treeData} onSelect={handleSelect} defaultExpandAll />
      </Card>

      <Card
        title={selectedTitle || "代码预览"}
        style={{ flex: 1 }}
        extra={
          selectedCode && (
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
              复制代码
            </Button>
          )
        }
      >
        {selectedCode ? (
          <pre
            style={{
              background: "#f5f5f5",
              padding: "16px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            <code>{selectedCode}</code>
          </pre>
        ) : (
          <Text type="secondary">请从左侧选择要查看的代码</Text>
        )}
      </Card>
    </div>
  );
};

export default CodeTree;
