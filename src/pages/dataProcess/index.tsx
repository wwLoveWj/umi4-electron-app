import React, { useState } from "react";
import { Card, Checkbox, Button, Upload, message, Divider } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";

/**
 * @file 数据处理页面
 * @description 支持分模块导入导出系统数据，格式为JSON
 */

// 可选模块列表（可根据实际模块扩展）
const MODULES = [
  { value: "knowledge", label: "知识库" },
  { value: "approval", label: "审批流程" },
  { value: "code", label: "代码片段" },
  { value: "email", label: "邮件记录" },
  // 可继续添加其他模块
];

// 正确引入服务
import { knowledgeDBService } from "@/services/knowledgeDB";
import { indexedDBService } from "@/services/indexedDB";
import { indexedDBUtil } from "@/utils/indexedDB";

const DataProcess: React.FC = () => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  /**
   * 处理模块选择
   * @param checkedValue 选中的模块key数组
   */
  const handleModuleChange = (checkedValue: any) => {
    setSelectedModules(checkedValue);
  };

  /**
   * 导出选中模块数据，并保存到public目录
   */
  const handleExport = async () => {
    if (selectedModules.length === 0) {
      message.warning("请先选择要导出的模块");
      return;
    }
    setExporting(true);
    try {
      const exportData: Record<string, any> = {};
      // 导出知识库
      if (selectedModules.includes("knowledge")) {
        try {
          exportData.knowledge = await knowledgeDBService.getAllItems();
        } catch (e) {
          console.error("导出知识库出错", e);
          throw new Error("知识库导出失败");
        }
      }
      // 导出审批流程
      if (selectedModules.includes("approval")) {
        try {
          const approvalFlows = localStorage.getItem("approvalFlows");
          exportData.approval = approvalFlows ? JSON.parse(approvalFlows) : [];
        } catch (e) {
          console.error("导出审批流程出错", e);
          throw new Error("审批流程导出失败");
        }
      }
      // 导出代码片段
      if (selectedModules.includes("code")) {
        try {
          if (indexedDBService && indexedDBService.getAllSnippets) {
            const tree = await indexedDBService.getAllSnippets();
            function flatten(nodes: any[]): any[] {
              let arr: any[] = [];
              for (const node of nodes) {
                const { children, ...rest } = node;
                arr.push(rest);
                if (children && children.length) {
                  arr = arr.concat(flatten(children));
                }
              }
              return arr;
            }
            exportData.code = flatten(tree);
          }
        } catch (e) {
          console.error("导出代码片段出错", e);
          throw new Error("代码片段导出失败");
        }
      }
      // 导出邮件记录
      if (selectedModules.includes("email")) {
        try {
          exportData.email = await indexedDBUtil.getAllEmailRecords();
        } catch (e) {
          console.error("导出邮件记录出错", e);
          throw new Error("邮件记录导出失败");
        }
      }
      // 生成导出文件名：模块名_时间戳.json
      const moduleNames = MODULES.filter((m) =>
        selectedModules.includes(m.value)
      )
        .map((m) => m.label)
        .join("_");
      const timeStr = new Date()
        .toISOString()
        .replace(/[:T]/g, "-")
        .slice(0, 19);
      const fileName = `${moduleNames}_${timeStr}.json`;
      // 保存到public目录（需Electron或Node支持）

      // 浏览器环境，下载到本地
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("导出成功");
      //   }
    } catch (err) {
      message.error("导出失败");
    } finally {
      setExporting(false);
    }
  };

  /**
   * 导入数据
   * @param file 上传的文件对象
   */
  const handleImport = async (file: any) => {
    setImporting(true);
    try {
      // 使用FileReader读取JSON文件
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          // 按模块导入数据
          // 导入知识库
          if (json.knowledge && Array.isArray(json.knowledge)) {
            if (knowledgeDBService && knowledgeDBService.addItem) {
              for (const item of json.knowledge) {
                try {
                  await knowledgeDBService.addItem(item);
                } catch (e) {
                  // 跳过已存在的id
                }
              }
            }
          }
          // 导入审批流程
          if (json.approval && Array.isArray(json.approval)) {
            localStorage.setItem(
              "approvalFlows",
              JSON.stringify(json.approval)
            );
          }
          // 导入代码片段
          if (json.code && Array.isArray(json.code)) {
            if (indexedDBService && indexedDBService.addSnippet) {
              for (const node of json.code) {
                try {
                  await indexedDBService.addSnippet(node);
                } catch (e) {
                  // 跳过已存在的key
                }
              }
            }
          }
          // 导入邮件记录
          if (json.email && Array.isArray(json.email)) {
            if (indexedDBUtil && indexedDBUtil.saveEmailRecord) {
              for (const record of json.email) {
                try {
                  // 清洗数据，避免id冲突
                  const { id, ...rest } = record;
                  // 自动补全taskId
                  if (!rest.taskId) {
                    rest.taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                  }
                  await indexedDBUtil.saveEmailRecord(rest);
                } catch (e) {
                  // 跳过已存在的taskId
                }
              }
            }
          }
          message.success("导入成功");
        } catch (err) {
          message.error("导入失败，文件内容不是有效的JSON");
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file, "utf-8");
    } catch (err) {
      message.error("导入失败，文件格式错误或内容无效");
      setImporting(false);
    }
    return false; // 阻止Upload自动上传
  };

  return (
    <Card title="数据处理" style={{ maxWidth: 600, margin: "0 auto" }}>
      <p>请选择需要导入/导出的模块：</p>
      <Checkbox.Group
        options={MODULES}
        value={selectedModules}
        onChange={handleModuleChange}
        style={{ marginBottom: 16 }}
      />
      <Divider />
      <div style={{ display: "flex", gap: 16 }}>
        <Upload
          accept="application/json"
          showUploadList={false}
          beforeUpload={handleImport}
          disabled={importing}
        >
          <Button icon={<UploadOutlined />} loading={importing}>
            导入JSON
          </Button>
        </Upload>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={handleExport}
          loading={exporting}
        >
          导出JSON
        </Button>
      </div>
      <Divider />
      <p style={{ color: "#888", fontSize: 13 }}>
        导入导出数据仅限本地操作，数据格式为JSON。请妥善保存导出文件。
      </p>
    </Card>
  );
};

export default DataProcess;
