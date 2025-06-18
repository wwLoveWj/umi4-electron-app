/**
 * @file 位置监控服务
 */
import { message } from "antd";

interface Location {
  latitude: number;
  longitude: number;
}

interface AlertConfig {
  center: Location;
  radius: number; // 单位：米
}

// 声明高德地图全局类型
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    AMap: any;
  }
}

class LocationService {
  private map: any;
  private alertConfig: AlertConfig | null = null;
  private watchId: number | null = null;
  private isAlerting: boolean = false;
  private audioContext: AudioContext | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private isMapInitialized: boolean = false;
  private mapInitPromise: Promise<void>;
  private geolocation: any = null;

  constructor() {
    this.mapInitPromise = this.initAMap();
  }

  /**
   * 初始化高德地图
   */
  private async initAMap(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMapInitialized) {
        console.log("地图已经初始化");
        resolve();
        return;
      }

      console.log("开始初始化地图...");

      // 检查是否已经加载了高德地图脚本
      if (window.AMap) {
        console.log("检测到已加载高德地图脚本");
        this.initMap();
        this.isMapInitialized = true;
        resolve();
        return;
      }

      window._AMapSecurityConfig = {
        securityJsCode: "18353d5c91ace9d00c0cfdd90879dafe",
      };

      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=882c94eea50e2900d1e33043cdfb88d5&plugin=AMap.Geolocation`;
      script.async = true;

      script.onload = () => {
        console.log("高德地图脚本加载成功");
        this.initMap();
        this.isMapInitialized = true;
        resolve();
      };

      script.onerror = (error) => {
        console.error("高德地图脚本加载失败:", error);
        message.error("地图加载失败，请检查网络连接");
        reject(error);
      };

      document.head.appendChild(script);
      console.log("已添加高德地图脚本到页面");
    });
  }

  /**
   * 初始化地图实例
   */
  private initMap() {
    try {
      console.log("开始创建地图实例...");

      // 获取地图容器
      const container = document.getElementById("map-container");
      if (!container) {
        throw new Error("找不到地图容器元素");
      }

      // 初始化地图
      this.map = new window.AMap.Map("map-container", {
        zoom: 11,
        resizeEnable: true,
        viewMode: "2D",
        features: ["bg", "road", "building"],
        mapStyle: "amap://styles/normal",
        preloadMode: true,
      });

      // 初始化定位插件
      this.geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        buttonPosition: "RB",
        buttonOffset: new window.AMap.Pixel(10, 20),
        zoomToAccuracy: true,
      });

      // 添加定位控件到地图
      this.map.addControl(this.geolocation);

      // 添加地图加载完成事件监听
      this.map.on("complete", () => {
        console.log("地图加载完成");
      });

      // 添加地图加载错误事件监听
      this.map.on("error", (error: any) => {
        console.error("地图加载错误:", error);
        message.error("地图加载错误");
      });

      console.log("地图实例创建成功");
    } catch (error) {
      console.error("地图初始化失败:", error);
      message.error("地图初始化失败");
      throw error;
    }
  }

  /**
   * 检查地图是否已初始化
   */
  public isMapReady(): boolean {
    return this.isMapInitialized && !!this.map;
  }

  /**
   * 获取地图初始化状态
   */
  public async getMapStatus(): Promise<{
    initialized: boolean;
    mapExists: boolean;
  }> {
    await this.mapInitPromise;
    return {
      initialized: this.isMapInitialized,
      mapExists: !!this.map,
    };
  }

  /**
   * 设置报警区域
   */
  public async setAlertArea(center: Location, radius: number) {
    try {
      await this.mapInitPromise;

      if (!this.map) {
        throw new Error("地图未初始化");
      }

      this.alertConfig = { center, radius };
      this.drawAlertCircle();
    } catch (error) {
      console.error("设置报警区域失败:", error);
      message.error("设置报警区域失败");
      throw error;
    }
  }

  /**
   * 绘制报警区域
   */
  private drawAlertCircle() {
    if (!this.alertConfig || !this.map) return;

    try {
      const circle = new window.AMap.Circle({
        center: [
          this.alertConfig.center.longitude,
          this.alertConfig.center.latitude,
        ],
        radius: this.alertConfig.radius,
        strokeColor: "#FF0000",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#FF0000",
        fillOpacity: 0.2,
      });

      circle.setMap(this.map);
    } catch (error) {
      console.error("绘制报警区域失败:", error);
      message.error("绘制报警区域失败");
    }
  }

  /**
   * 开始位置监控
   */
  public async startMonitoring() {
    try {
      await this.mapInitPromise;

      if (!this.map) {
        throw new Error("地图未初始化");
      }

      if (!this.alertConfig) {
        throw new Error("未设置报警区域");
      }

      if (!this.geolocation) {
        throw new Error("定位插件未初始化");
      }

      // 获取当前位置
      this.geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === "complete") {
          this.checkLocation(result.position);
        } else {
          message.error("获取位置信息失败");
        }
      });

      // 持续监控位置变化
      this.watchId = this.geolocation.watchPosition(
        (status: string, result: any) => {
          if (status === "complete") {
            this.checkLocation(result.position);
          }
        }
      );

      message.success("位置监控已启动");
    } catch (error) {
      console.error("启动位置监控失败:", error);
      message.error("启动位置监控失败: " + (error as Error).message);
      throw error;
    }
  }

  /**
   * 检查位置是否在报警区域内
   */
  private checkLocation(position: Location) {
    if (!this.alertConfig) return;

    try {
      const distance = this.calculateDistance(
        position,
        this.alertConfig.center
      );
      console.log("当前位置距离中心点:", distance, "米");

      if (distance <= this.alertConfig.radius) {
        this.triggerAlert();
      } else {
        this.stopAlert();
      }
    } catch (error) {
      console.error("检查位置失败:", error);
    }
  }

  /**
   * 计算两点之间的距离（米）
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 触发报警
   */
  private triggerAlert() {
    if (this.isAlerting) return;
    this.isAlerting = true;

    try {
      // 创建音频上下文
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // 创建振荡器
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      this.currentOscillator = oscillator;

      message.warning("已进入警戒区域！");
    } catch (error) {
      console.error("触发报警失败:", error);
    }
  }

  /**
   * 停止报警
   */
  private stopAlert() {
    if (!this.isAlerting) return;
    this.isAlerting = false;

    try {
      if (this.currentOscillator) {
        this.currentOscillator.stop();
        this.currentOscillator = null;
      }
    } catch (error) {
      console.error("停止报警失败:", error);
    }
  }

  /**
   * 停止监控
   */
  public stopMonitoring() {
    try {
      if (this.watchId) {
        const geolocation = this.map?.getControl("AMap.Geolocation");
        if (geolocation) {
          geolocation.clearWatch(this.watchId);
        }
        this.watchId = null;
      }
      this.stopAlert();
      message.success("位置监控已停止");
    } catch (error) {
      console.error("停止监控失败:", error);
      message.error("停止监控失败");
    }
  }
}

export const locationService = new LocationService();
