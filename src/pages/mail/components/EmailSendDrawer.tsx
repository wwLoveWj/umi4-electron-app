import React, { useState, useEffect } from "react";
import { Button, Modal, Form, message } from "antd";
import { useControllableValue } from "ahooks";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";
import CronGenerator from "./CronGenerator";
import { indexedDBUtil } from "@/utils/indexedDB";
// import ScheduleSetModal from "./ScheduleSetModal";

interface EmailSendDrawerProps {
  open?: boolean;
  onChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const EmailSendDrawer: React.FC<EmailSendDrawerProps> = (props) => {
  //   const [loading, setLoading] = useState(false);
  const [open, setOpen] = useControllableValue<boolean>(props);
  const [openCron, setOpenCron] = useState(false);
  const [formRef] = Form.useForm();
  // 添加一个状态来强制 WjForm 重新渲染
  const [renderKey, setRenderKey] = useState(0);

  // ** 使用 useWatch 监听 regularlySend 的变化 **
  // 注意：useWatch 需要在组件顶层调用，且依赖 formRef
  const regularlySendValue = Form.useWatch("regularlySend", formRef);

  // ** 使用 useEffect 在 regularlySendValue 变化时更新 renderKey **
  // 这样当 regularlySend 的值改变时，会触发 EmailSendDrawer 重新渲染
  // renderKey 的变化会强制 WjForm 重新挂载
  useEffect(() => {
    setRenderKey((prevKey) => prevKey + 1);
  }, [regularlySendValue]); // 依赖 regularlySendValue
  // 发送邮件
  const handleOk = () => {
    return formRef?.validateFields().then((res) => {
      const params = {
        ...res,
        sendToWho: res?.sendToWho?.replace(/\s*/g, ""), //去除所有空格
      };
      ipcRenderer.send("ss:send-email", params);

      // 保存邮件记录
      indexedDBUtil
        .saveEmailRecord({
          sendTime: new Date().toISOString(),
          sender: "当前用户", // 这里可以根据实际情况获取发送人信息
          content: params.content,
          subject: params.title,
          isSuccess: true, // 这里可以根据实际发送结果更新
          recipients: params.sendToWho,
        })
        .then(() => {
          props.onSuccess?.(); // 调用成功回调
        })
        .catch((error) => {
          console.error("保存邮件记录失败:", error);
        });

      setOpen(false);
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // 定时发送
  const handleRegulartimeSend = () => {
    return formRef?.validateFields().then((res) => {
      const params = {
        ...res,
        sendToWho: res?.sendToWho?.replace(/\s*/g, ""), //去除所有空格
      };
      ipcRenderer.send("ss:schedule-email", params);

      // 保存定时邮件记录
      indexedDBUtil
        .saveEmailRecord({
          sendTime: new Date().toISOString(),
          sender: "当前用户", // 这里可以根据实际情况获取发送人信息
          content: params.content,
          subject: params.title,
          isSuccess: true, // 这里可以根据实际发送结果更新
          recipients: params.sendToWho,
        })
        .then(() => {
          props.onSuccess?.(); // 调用成功回调
        })
        .catch((error) => {
          console.error("保存邮件记录失败:", error);
        });

      setOpen(false);
    });
  };
  const columns: WjFormColumnsPropsType[] = [
    {
      valueType: "mentions",
      search: true,
      dataIndex: "sendToWho",
      title: "收件人邮箱",
      formItemProps: {
        rules: [{ required: true }],
      },
      fieldProps: {
        prefix: ["@"],
        options: ["163.com", "qq.com", "ww.com"].map((value) => ({
          key: value,
          value,
          label: value,
        })),
      },
    },
    {
      dataIndex: "title",
      title: "邮件主题",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "请输入邮件主题" }],
      },
    },
    {
      valueType: "textarea",
      search: true,
      dataIndex: "content",
      title: "邮件内容",
    },
    {
      valueType: "switch",
      dataIndex: "regularlySend",
      title: "定时发送",
      search: true,
      formItemProps: {
        rules: [{ required: true, message: "是否开启定时发送" }],
      },
      fieldProps: {
        checkedChildren: "开启",
        unCheckedChildren: "关闭",
      },
    },
    {
      search: formRef.getFieldValue("regularlySend"),
      dataIndex: "cronValue",
      title: "cron规则",
      formItemProps: {
        dependencies: ["regularlySend"],
        shouldUpdate: true,
        rules: [{ required: true, message: "是否开启定时发送" }],
      },
      // 使用 visibleWhen 控制显示隐藏
      //   visibleWhen: (form: FormInstance) => {
      //     debugger;
      //     // 假设 visibleWhen 接收 form 实例
      //     return form.getFieldValue("regularlySend"); // 根据 regularlySend 的布尔值决定是否可见
      //   },
      fieldProps: {
        addonAfter: (
          <Button
            type="primary"
            style={{ margin: "-1px -12px", border: "none" }}
            onClick={() => setOpenCron(true)}
          >
            生成
          </Button>
        ),
      },
    },
  ];
  return (
    <>
      <Modal
        open={open}
        title="邮件发送"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={
          formRef.getFieldValue("regularlySend")
            ? [
                <Button key="back" onClick={handleCancel}>
                  取消
                </Button>,
                <Button
                  key="fixed"
                  type="primary"
                  danger
                  onClick={handleRegulartimeSend}
                >
                  定时发送
                </Button>,
              ]
            : [
                <Button key="back" onClick={handleCancel}>
                  取消
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                  发邮件
                </Button>,
              ]
        }
      >
        <WjForm
          key={renderKey} // 添加 key prop
          form={formRef}
          formType="basic"
          noCard={true}
          formConfigList={columns?.filter((item) => item?.search)}
        />
        {formRef.getFieldValue("regularlySend") && <CronGenerator />}
      </Modal>
      {/* <ScheduleSetModal
        value={openCron}
        onChange={setOpenCron}
        form={formRef}
      /> */}
    </>
  );
};

export default EmailSendDrawer;
