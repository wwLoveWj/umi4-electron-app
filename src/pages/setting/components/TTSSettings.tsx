import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Slider,
  Switch,
  Collapse,
  Space,
  Table,
  Popconfirm,
  message,
  Form,
  InputNumber,
  Divider,
  Tooltip,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  SoundOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import "./BackgroundSettings.less";

const { Option } = Select;
const { Panel } = Collapse;
const { ipcRenderer } = window.require("electron");

/**
 * TTS朗读设置页面
 * 支持音量、音色、语速调节
 */
const defaultPreset = { name: "", rate: 1.0, volume: 1.0, pitch: 1.0 };
const defaultVoice = { name: "", value: "", language: "", description: "" };
const defaultShortcuts = {
  startReading: "Ctrl+Shift+R",
  stopReading: "Ctrl+Shift+S",
  pauseReading: "Ctrl+Shift+P",
  nextText: "Ctrl+Shift+N",
  previousText: "Ctrl+Shift+B",
};

const TTSSettings: React.FC = () => {
  const [config, setConfig] = useState<any>({});
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVoice, setEditVoice] = useState<any | null>(null);
  const [editPreset, setEditPreset] = useState<any | null>(null);
  const [editShortcut, setEditShortcut] = useState<string | null>(null);
  const [form] = Form.useForm();

  // 加载配置和音色
  useEffect(() => {
    setLoading(true);
    Promise.all([
      ipcRenderer.invoke("tts:read-config"),
      ipcRenderer.invoke("tts:get-voices"),
    ])
      .then(([cfgRes, voiceRes]: any[]) => {
        if (cfgRes.success) setConfig(cfgRes.config);
        if (voiceRes.success) setVoices(voiceRes.voices);
      })
      .finally(() => setLoading(false));

    // 监听主进程配置变更事件
    const reloadConfig = () => {
      ipcRenderer.invoke("tts:read-config").then((cfgRes: any) => {
        if (cfgRes.success) setConfig(cfgRes.config);
      });
    };
    ipcRenderer.on("tts-config-changed", reloadConfig);
    return () => {
      ipcRenderer.removeListener("tts-config-changed", reloadConfig);
    };
  }, []);

  // 保存配置
  const handleSave = async () => {
    setLoading(true);
    const res = await ipcRenderer.invoke("tts:save-config", config);
    setLoading(false);
    if (res?.success) {
      message.success("TTS设置已保存");
    } else {
      message.error("保存失败: " + (res?.error || "未知错误"));
    }
  };

  // ========== 基础设置 ========== //
  const defaultCfg = config.default || {};
  const handleDefaultChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      default: { ...prev.default, [key]: value },
    }));
  };

  // ========== 自定义音色 ========== //
  const customVoices = config.customVoices || [];
  const handleAddVoice = () => {
    setEditVoice({ ...defaultVoice });
  };
  const handleEditVoice = (record: any) => {
    setEditVoice({ ...record });
  };
  const handleDeleteVoice = (idx: number) => {
    setConfig((prev: any) => ({
      ...prev,
      customVoices: prev.customVoices.filter((_: any, i: number) => i !== idx),
    }));
  };
  const handleVoiceModalOk = () => {
    form.validateFields().then((values) => {
      let newList = [...customVoices];
      if (editVoice && editVoice._editIdx !== undefined) {
        newList[editVoice._editIdx] = values;
      } else {
        newList.push(values);
      }
      setConfig((prev: any) => ({ ...prev, customVoices: newList }));
      setEditVoice(null);
      form.resetFields();
    });
  };
  const handleVoiceModalCancel = () => {
    setEditVoice(null);
    form.resetFields();
  };

  // ========== 全局设置 ========== //
  const handleGlobalChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  // ========== 批量朗读设置 ========== //
  const batchSettings = config.batchSettings || {};
  const handleBatchChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      batchSettings: { ...prev.batchSettings, [key]: value },
    }));
  };

  // ========== 预设 ========== //
  const presets = config.presets || {};
  const handleAddPreset = () => {
    setEditPreset({ ...defaultPreset, key: "" });
  };
  const handleEditPreset = (key: string, preset: any) => {
    setEditPreset({ ...preset, key, _editKey: key });
  };
  const handleDeletePreset = (key: string) => {
    const newPresets = { ...presets };
    delete newPresets[key];
    setConfig((prev: any) => ({ ...prev, presets: newPresets }));
  };
  const handlePresetModalOk = () => {
    form.validateFields().then((values) => {
      let newPresets = { ...presets };
      let key = values.key;
      // 新增时不允许重复
      if (!editPreset && newPresets[key]) {
        message.error("标识符已存在，请修改");
        return;
      }
      newPresets[key] = {
        name: values.name,
        rate: values.rate,
        volume: values.volume,
        pitch: values.pitch,
      };
      setConfig((prev: any) => ({ ...prev, presets: newPresets }));
      setEditPreset(null);
      form.resetFields();
    });
  };
  const handlePresetModalCancel = () => {
    setEditPreset(null);
    form.resetFields();
  };

  // ========== 快捷键 ========== //
  const shortcuts = config.shortcuts || defaultShortcuts;
  const handleShortcutChange = (key: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      shortcuts: { ...(prev.shortcuts || shortcuts), [key]: value },
    }));
  };

  return (
    <div className="setting-panel" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>
        <SoundOutlined /> TTS朗读设置
      </h2>
      <Collapse
        defaultActiveKey={[
          "default",
          "voices",
          "global",
          "batch",
          "presets",
          "shortcuts",
        ]}
      >
        {/* 基础设置 */}
        <Panel header="基础设置" key="default">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <label>默认音色：</label>
              <Select
                value={defaultCfg.voice}
                onChange={(v) => handleDefaultChange("voice", v)}
                style={{ width: 300 }}
                showSearch
                optionFilterProp="children"
                placeholder="请选择音色"
              >
                {[...voices, ...(customVoices || [])].map((v) => (
                  <Option key={v.value} value={v.value}>
                    {v.name} ({v.value})
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label>语速：</label>
              <Slider
                min={0.5}
                max={2.0}
                step={0.01}
                value={defaultCfg.rate}
                onChange={(v) => handleDefaultChange("rate", v)}
                style={{ width: 300 }}
              />
            </div>
            <div>
              <label>音量：</label>
              <Slider
                min={0.1}
                max={2.0}
                step={0.01}
                value={defaultCfg.volume}
                onChange={(v) => handleDefaultChange("volume", v)}
                style={{ width: 300 }}
              />
            </div>
            <div>
              <label>音调：</label>
              <Slider
                min={0.5}
                max={2.0}
                step={0.01}
                value={defaultCfg.pitch}
                onChange={(v) => handleDefaultChange("pitch", v)}
                style={{ width: 300 }}
              />
            </div>
          </Space>
        </Panel>
        {/* 自定义音色 */}
        <Panel header="自定义音色" key="voices">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddVoice}
            style={{ marginBottom: 12 }}
          >
            新增音色
          </Button>
          <Table
            dataSource={customVoices.map((v: any, i: number) => ({
              ...v,
              key: i,
            }))}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "值", dataIndex: "value" },
              { title: "语言", dataIndex: "language" },
              { title: "描述", dataIndex: "description" },
              {
                title: "操作",
                render: (_: any, record: any, idx: number) => (
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() =>
                        handleEditVoice({ ...record, _editIdx: idx })
                      }
                    />
                    <Popconfirm
                      title="确定删除该音色？"
                      onConfirm={() => handleDeleteVoice(idx)}
                    >
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={false}
            size="small"
          />
          <Modal
            title={editVoice?._editIdx !== undefined ? "编辑音色" : "新增音色"}
            open={!!editVoice}
            onOk={handleVoiceModalOk}
            onCancel={handleVoiceModalCancel}
            destroyOnClose
          >
            <Form
              form={form}
              initialValues={editVoice || defaultVoice}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: "请输入名称" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="value"
                label="值"
                rules={[{ required: true, message: "请输入值" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="language"
                label="语言"
                rules={[{ required: true, message: "请输入语言" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </Panel>
        {/* 全局设置 */}
        <Panel header="全局设置" key="global">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <label>自动播放：</label>
              <Switch
                checked={!!config.autoPlay}
                onChange={(v) => handleGlobalChange("autoPlay", v)}
              />
            </div>
            <div>
              <label>保存音频：</label>
              <Switch
                checked={!!config.saveAudio}
                onChange={(v) => handleGlobalChange("saveAudio", v)}
              />
            </div>
            <div>
              <label>音频保存路径：</label>
              <Input
                value={config.audioPath}
                onChange={(e) =>
                  handleGlobalChange("audioPath", e.target.value)
                }
                style={{ width: 300 }}
              />
            </div>
          </Space>
        </Panel>
        {/* 批量朗读设置 */}
        <Panel header="批量朗读设置" key="batch">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <label>朗读间隔（毫秒）：</label>
              <InputNumber
                min={0}
                max={10000}
                step={100}
                value={batchSettings.interval}
                onChange={(v) => handleBatchChange("interval", v)}
              />
            </div>
            <div>
              <label>自动停止：</label>
              <Switch
                checked={!!batchSettings.autoStop}
                onChange={(v) => handleBatchChange("autoStop", v)}
              />
            </div>
            <div>
              <label>最大朗读时长（秒）：</label>
              <InputNumber
                min={0}
                max={3600}
                step={1}
                value={batchSettings.maxDuration}
                onChange={(v) => handleBatchChange("maxDuration", v)}
              />
            </div>
          </Space>
        </Panel>
        {/* 音色预设 */}
        <Panel header="音色预设" key="presets">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddPreset}
            style={{ marginBottom: 12 }}
          >
            新增预设
          </Button>
          <Table
            dataSource={Object.entries(presets).map(([key, v]: any) => ({
              ...v,
              key,
            }))}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "语速", dataIndex: "rate" },
              { title: "音量", dataIndex: "volume" },
              { title: "音调", dataIndex: "pitch" },
              {
                title: "操作",
                render: (_: any, record: any) => (
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => handleEditPreset(record.key, record)}
                    />
                    <Popconfirm
                      title="确定删除该预设？"
                      onConfirm={() => handleDeletePreset(record.key)}
                    >
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={false}
            size="small"
          />
          <Modal
            title={editPreset?._editKey ? "编辑预设" : "新增预设"}
            open={!!editPreset}
            onOk={handlePresetModalOk}
            onCancel={handlePresetModalCancel}
            destroyOnClose
          >
            <Form
              form={form}
              initialValues={editPreset || defaultPreset}
              layout="vertical"
            >
              <Form.Item
                name="key"
                label="标识符"
                rules={[
                  {
                    required: true,
                    message: "请输入唯一标识符（如 slow、fast）",
                  },
                  {
                    pattern: /^[a-zA-Z0-9_]+$/,
                    message: "只能包含字母、数字、下划线",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: "请输入名称" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="rate" label="语速" rules={[{ required: true }]}>
                <InputNumber
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item
                name="volume"
                label="音量"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0.1}
                  max={2.0}
                  step={0.01}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item name="pitch" label="音调" rules={[{ required: true }]}>
                <InputNumber
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  style={{ width: 120 }}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Panel>
        {/* 快捷键设置 */}
        <Panel header="快捷键设置" key="shortcuts">
          <Table
            dataSource={Object.entries(
              config.shortcuts || defaultShortcuts
            ).map(([key, value]) => ({ key, value }))}
            columns={[
              { title: "功能", dataIndex: "key" },
              {
                title: "快捷键",
                dataIndex: "value",
                render: (v: string, record: any) => (
                  <Input
                    value={v}
                    onChange={(e) =>
                      handleShortcutChange(record.key, e.target.value)
                    }
                    style={{ width: 180 }}
                  />
                ),
              },
            ]}
            pagination={false}
            size="small"
          />
        </Panel>
      </Collapse>
      <Divider />
      <div style={{ textAlign: "center" }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          size="large"
          loading={loading}
        >
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default TTSSettings;
