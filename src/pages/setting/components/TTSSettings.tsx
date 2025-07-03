import React, { useEffect, useState } from "react";
import { Slider, Select, Button, message, Spin } from "antd";
import { AudioOutlined, SoundOutlined } from "@ant-design/icons";
import "./BackgroundSettings.less"; // 复用设置页面样式
const { ipcRenderer } = window.require("electron");
const { Option } = Select;

/**
 * TTS朗读设置页面
 * 支持音量、音色、语速调节
 */
const TTSSettings: React.FC = () => {
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [voice, setVoice] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取音色列表和当前配置
  useEffect(() => {
    setLoading(true);
    ipcRenderer
      ?.invoke("tts:get-voices")
      .then((res: any) => {
        if (res.success) {
          setVoices(res.voices);
        }
      })
      .finally(() => setLoading(false));
    ipcRenderer?.invoke("tts:read-config").then((res: any) => {
      if (res.success && res.config?.default) {
        setVolume(res.config.default.volume ?? 1.0);
        setRate(res.config.default.rate ?? 1.0);
        setVoice(res.config.default.voice ?? "");
      }
    });
  }, []);

  // 保存设置
  const handleSave = async () => {
    setLoading(true);
    const config = {
      default: {
        voice,
        rate,
        volume,
        pitch: 1.0,
      },
    };
    const res = await ipcRenderer?.invoke("tts:save-config", config);
    setLoading(false);
    if (res?.success) {
      message.success("TTS设置已保存");
    } else {
      message.error("保存失败: " + (res?.error || "未知错误"));
    }
  };

  return (
    <div className="setting-panel" style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>
        <SoundOutlined /> TTS朗读设置
      </h2>
      <Spin spinning={loading}>
        <div style={{ marginBottom: 32 }}>
          <label>音量：</label>
          <Slider
            min={0.1}
            max={1.0}
            step={0.01}
            value={volume}
            onChange={setVolume}
            tooltipVisible
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 32 }}>
          <label>语速：</label>
          <Slider
            min={0.5}
            max={2.0}
            step={0.05}
            value={rate}
            onChange={setRate}
            tooltipVisible
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 32 }}>
          <label>音色：</label>
          <Select
            value={voice}
            onChange={setVoice}
            style={{ width: "100%" }}
            placeholder="请选择音色"
            showSearch
            optionFilterProp="children"
          >
            {voices.map((v) => (
              <Option key={v.value} value={v.value}>
                {v.name} ({v.value})
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            icon={<AudioOutlined />}
            onClick={handleSave}
            size="large"
          >
            保存设置
          </Button>
        </div>
      </Spin>
    </div>
  );
};

export default TTSSettings;
