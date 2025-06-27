/**
 * @file 位置监控页面
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  InputNumber,
  Button,
  Space,
  message,
  Spin,
  Alert,
  Modal,
} from "antd";
import { locationService } from "@/services/location";

const LocationMonitor: React.FC = () => {
  const [radius, setRadius] = useState<number>(100);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [mapStatus, setMapStatus] = useState<{
    initialized: boolean;
    mapExists: boolean;
  }>({
    initialized: false,
    mapExists: false,
  });
  const MAX_RETRIES = 2;
  const MAP_INIT_CHECK_INTERVAL = 1000;
  const MAX_MAP_INIT_CHECKS = 10;

  useEffect(() => {
    checkMapStatus();
    return () => {
      locationService.stopMonitoring();
    };
  }, []);

  const checkMapStatus = async () => {
    let checkCount = 0;

    const checkStatus = async () => {
      try {
        const status = await locationService.getMapStatus();
        setMapStatus(status);

        if (!status.initialized || !status.mapExists) {
          if (checkCount < MAX_MAP_INIT_CHECKS) {
            checkCount++;
            message.loading(
              `地图初始化中，请稍候...(${checkCount}/${MAX_MAP_INIT_CHECKS})`
            );
            setTimeout(checkStatus, MAP_INIT_CHECK_INTERVAL);
          } else {
            message.error("地图初始化超时，请刷新页面重试");
          }
        } else {
          message.success("地图初始化完成");
        }
      } catch (error) {
        console.error("检查地图状态失败:", error);
        message.error("地图初始化失败，请刷新页面重试");
      }
    };

    await checkStatus();
  };

  const checkGeolocationSupport = (): boolean => {
    if (!navigator.geolocation) {
      message.error("您的浏览器不支持地理位置功能");
      return false;
    }
    return true;
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      debugger;
      if (!checkGeolocationSupport()) {
        reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      };

      try {
        const timeoutId = setTimeout(() => {
          reject(new Error("TIMEOUT"));
        }, options.timeout);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            if (!position.coords.latitude || !position.coords.longitude) {
              reject(new Error("获取到的位置数据无效"));
              return;
            }
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error("获取位置失败:", error);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error("PERMISSION_DENIED"));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error("POSITION_UNAVAILABLE"));
                break;
              case error.TIMEOUT:
                reject(new Error("TIMEOUT"));
                break;
              default:
                reject(new Error("UNKNOWN_ERROR"));
            }
          },
          options
        );
      } catch (error) {
        console.error("调用地理位置API失败:", error);
        reject(new Error("GEOLOCATION_API_ERROR"));
      }
    });
  };

  const showLocationErrorModal = useCallback(
    (error: any) => {
      let title = "获取位置失败";
      let content: React.ReactNode = "";
      let type: "error" | "warning" = "error";

      switch (error.message) {
        case "GEOLOCATION_NOT_SUPPORTED":
          title = "浏览器不支持地理位置";
          content = (
            <div>
              <p>您的浏览器不支持地理位置功能，请：</p>
              <ol>
                <li>使用最新版本的Chrome、Firefox或Edge浏览器</li>
                <li>确保浏览器已启用地理位置功能</li>
                <li>如果使用Electron，请确保已授予地理位置权限</li>
              </ol>
            </div>
          );
          break;
        case "PERMISSION_DENIED":
          title = "位置权限被拒绝";
          content = (
            <div>
              <p>请按以下步骤操作：</p>
              <ol>
                <li>在浏览器设置中允许获取位置</li>
                <li>检查系统位置权限设置</li>
                <li>确保没有其他应用阻止位置访问</li>
                <li>如果使用Electron，请在系统设置中允许应用访问位置</li>
              </ol>
            </div>
          );
          break;
        case "POSITION_UNAVAILABLE":
          title = "位置信息不可用";
          content = (
            <div>
              <p>请确保：</p>
              <ol>
                <li>已开启设备位置服务</li>
                <li>已允许浏览器获取位置权限</li>
                <li>GPS信号良好</li>
                <li>如果在室内，请移动到靠近窗户的位置</li>
              </ol>
            </div>
          );
          break;
        case "TIMEOUT":
          title = "位置获取超时";
          content = (
            <div>
              <p>请检查以下问题：</p>
              <ol>
                <li>网络连接是否稳定</li>
                <li>GPS信号是否良好</li>
                <li>是否在室内（建议移至室外）</li>
                <li>设备GPS是否已开启</li>
              </ol>
              <p>建议操作：</p>
              <ol>
                <li>移动到室外或靠近窗户的位置</li>
                <li>确保GPS已开启</li>
                <li>检查网络连接</li>
                <li>如果问题持续，请尝试重启设备</li>
              </ol>
            </div>
          );
          type = "warning";
          break;
        case "GEOLOCATION_API_ERROR":
          title = "地理位置API错误";
          content = (
            <div>
              <p>调用地理位置API时发生错误，请：</p>
              <ol>
                <li>刷新页面重试</li>
                <li>检查浏览器控制台是否有其他错误</li>
                <li>如果使用Electron，请确保应用有正确的权限</li>
              </ol>
            </div>
          );
          break;
        default:
          content = error.message || "未知错误";
      }

      Modal[type]({
        title,
        content,
        okText: "我知道了",
        onOk: () => {
          if (type === "warning" && retryCount < MAX_RETRIES) {
            setTimeout(() => tryGetLocation(retryCount), 1000);
          } else {
            setIsLoading(false);
          }
        },
      });
    },
    [retryCount]
  );

  const tryGetLocation = async (currentRetry: number) => {
    try {
      if (!mapStatus.initialized || !mapStatus.mapExists) {
        message.warning("地图未初始化完成，正在等待...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!mapStatus.initialized || !mapStatus.mapExists) {
          throw new Error("地图初始化超时，请刷新页面重试");
        }
      }
      debugger;
      const position = await getCurrentPosition();
      const center = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (isNaN(center.latitude) || isNaN(center.longitude)) {
        throw new Error("位置数据无效");
      }

      await locationService.setAlertArea(center, radius);
      await locationService.startMonitoring();
      setIsMonitoring(true);
      setRetryCount(0);
      setIsLoading(false);
    } catch (error: any) {
      const nextRetry = currentRetry + 1;

      if (nextRetry <= MAX_RETRIES) {
        setRetryCount(nextRetry);
        const remainingRetries = MAX_RETRIES - nextRetry;
        message.warning(`获取位置失败，剩余重试次数：${remainingRetries}`);

        if (error.message === "PERMISSION_DENIED") {
          showLocationErrorModal(error);
          setIsLoading(false);
          handleStopMonitoring();
          return;
        }

        setTimeout(() => {
          if (!isMonitoring) {
            tryGetLocation(nextRetry);
          }
        }, 3000);
        return;
      }

      showLocationErrorModal(error);
      setIsLoading(false);
      handleStopMonitoring();
    }
  };

  const handleStartMonitoring = async () => {
    try {
      setIsLoading(true);
      setRetryCount(0);
      await tryGetLocation(0);
    } catch (error) {
      setIsLoading(false);
      showLocationErrorModal(error);
    }
  };

  const handleStopMonitoring = () => {
    try {
      locationService.stopMonitoring();
      setIsMonitoring(false);
      setRetryCount(0);
    } catch (error) {
      message.error("停止监控失败：" + (error as Error).message);
    }
  };

  return (
    <Card title="位置监控" style={{ margin: 16 }}>
      <Spin
        spinning={isLoading}
        tip={
          retryCount > 0
            ? `正在重试获取位置 (${retryCount}/${MAX_RETRIES})...`
            : "正在获取位置..."
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {!mapStatus.initialized && (
            <Alert
              message="地图初始化中"
              description="正在加载地图资源，请稍候..."
              type="info"
              showIcon
            />
          )}
          {!mapStatus.mapExists && mapStatus.initialized && (
            <Alert
              message="地图加载失败"
              description="请检查网络连接并刷新页面重试"
              type="error"
              showIcon
            />
          )}
          <div>
            <span style={{ marginRight: 8 }}>报警半径（米）：</span>
            <InputNumber
              min={10}
              max={1000}
              value={radius}
              onChange={(value) => setRadius(value || 100)}
              disabled={isMonitoring || !mapStatus.mapExists}
            />
          </div>
          <div id="map-container" style={{ height: 400, marginBottom: 16 }} />
          <Space>
            <Button
              type="primary"
              onClick={handleStartMonitoring}
              disabled={isMonitoring || isLoading || !mapStatus.mapExists}
              loading={isLoading}
            >
              开始监控
            </Button>
            <Button
              danger
              onClick={handleStopMonitoring}
              disabled={!isMonitoring || isLoading}
            >
              停止监控
            </Button>
          </Space>
        </Space>
      </Spin>
    </Card>
  );
};

export default LocationMonitor;
