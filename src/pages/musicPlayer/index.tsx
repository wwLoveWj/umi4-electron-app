import React, { useRef, useState, useEffect } from "react";
import { Button, Slider, Upload, message } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  SoundOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import "./style.less";

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [fileList, setFileList] = useState<File[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // 进度条
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [current, fileList]);

  // 切歌
  const playNext = () => {
    setCurrent((prev) => (prev + 1) % fileList.length);
  };
  const playPrev = () => {
    setCurrent((prev) => (prev - 1 + fileList.length) % fileList.length);
  };

  // 切换音频时处理播放，消除play中断报错
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setProgress(0);
    if (playing && fileList[current]) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 0);
    }
    // eslint-disable-next-line
  }, [current, fileList]);

  // 文件导入
  const beforeUpload = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      message.error("只支持音频文件");
      return Upload.LIST_IGNORE;
    }
    setFileList((prev) => [...prev, file]);
    if (fileList.length === 0) setCurrent(0);
    return false;
  };

  // 进度条拖动
  const onSliderChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  // 音量
  const onVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  };

  // 播放/暂停，点击时才初始化AudioContext和可视化
  const handlePlayPause = () => {
    if (!playing) {
      // 首次播放时初始化
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        const source = audioCtxRef.current.createMediaElementSource(
          audioRef.current!
        );
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
        analyserRef.current.fftSize = 128;
        dataArrayRef.current = new Uint8Array(
          analyserRef.current.frequencyBinCount
        );
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      startWave();
    } else {
      stopWave();
    }
    setPlaying((p) => !p);
  };

  /**
   * 启动麦浪动画，防止重复启动
   * @returns {void}
   */
  const startWave = () => {
    if (animationIdRef.current) return; // 动画已在运行，保护
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current)
      return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    /**
     * 绘制麦浪动画帧
     * @returns {void}
     */
    function drawWave() {
      if (!ctx) return;
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / dataArrayRef.current!.length) * 2.5;
      let x = 0;
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const barHeight = dataArrayRef.current![i] * 0.7;
        const r = 80 + barHeight;
        const g = 200 + barHeight / 2;
        const b = 255;
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowColor = "#00f6ff";
        ctx.shadowBlur = 10;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      animationIdRef.current = requestAnimationFrame(drawWave);
    }
    animationIdRef.current = requestAnimationFrame(drawWave);
  };

  /**
   * 停止麦浪动画，清理动画ID
   * @returns {void}
   */
  const stopWave = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  };

  // 播放状态变化时控制动画
  useEffect(() => {
    if (playing) {
      startWave();
    } else {
      stopWave();
    }
    // eslint-disable-next-line
  }, [playing]);

  // 切歌/切换音频时停止动画
  useEffect(() => {
    return () => {
      stopWave();
      // 组件卸载时关闭 AudioContext
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // 切歌时停止动画，重置播放状态
  useEffect(() => {
    stopWave();
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setProgress(0);
    if (playing && fileList[current]) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 0);
    }
    // eslint-disable-next-line
  }, [current, fileList]);

  return (
    <div className="music-player-tech">
      <div className="player-main">
        <div className="wave-box">
          <canvas ref={canvasRef} width={600} height={120} />
        </div>
        <div className="player-controls">
          <Button
            icon={<StepBackwardOutlined />}
            shape="circle"
            size="large"
            onClick={playPrev}
            disabled={fileList.length === 0}
          />
          <Button
            icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            shape="circle"
            size="large"
            onClick={handlePlayPause}
            disabled={fileList.length === 0}
            style={{ margin: "0 16px" }}
          />
          <Button
            icon={<StepForwardOutlined />}
            shape="circle"
            size="large"
            onClick={playNext}
            disabled={fileList.length === 0}
          />
          <Slider
            min={0}
            max={duration}
            value={progress}
            onChange={onSliderChange}
            style={{ width: 200, margin: "0 24px" }}
            tooltip={{
              formatter: (v) =>
                v !== undefined
                  ? `${Math.floor(v / 60)}:${("0" + Math.floor(v % 60)).slice(-2)}`
                  : "",
            }}
          />
          <SoundOutlined style={{ color: "#00f6ff", marginRight: 8 }} />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVolumeChange}
            style={{ width: 80 }}
          />
          <Upload
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept="audio/mp3"
          >
            <Button icon={<FolderOpenOutlined />} style={{ marginLeft: 16 }}>
              导入MP3
            </Button>
          </Upload>
        </div>
        <audio
          ref={audioRef}
          src={
            fileList[current]
              ? URL.createObjectURL(fileList[current])
              : undefined
          }
          onEnded={playNext}
          style={{ display: "none" }}
        />
        <div className="player-info">
          {fileList[current] ? (
            <span>
              <span className="file-name">{fileList[current].name}</span>
              <span className="file-index">
                {current + 1}/{fileList.length}
              </span>
            </span>
          ) : (
            <span className="file-name">请导入MP3文件</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
