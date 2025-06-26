import React, { useState, useEffect } from "react";
import { Button, Modal, Form, message } from "antd";
import { useControllableValue } from "ahooks";
const { ipcRenderer } = window.require("electron");
import { WjForm } from "@/components/WjForm";
import type { WjFormColumnsPropsType } from "@/components/WjForm";
import CronGenerator from "./CronGenerator";
import { indexedDBUtil, EmailStatus } from "@/utils/indexedDB";
// import ScheduleSetModal from "./ScheduleSetModal";

interface EmailSendDrawerProps {
  open?: boolean;
  onChange?: (open: boolean) => void;
  onSuccess?: (taskId?: string) => void;
}

interface EmailSendResult {
  status: EmailStatus;
  error?: string;
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
      handleEmailRecord(params);
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };
  const handleEmailRecord = (
    params: { sendToWho: string; content: string; title: string },
    sendMsg = "ss:send-email",
    resultMsg = "ss:send-email-reply"
  ) => {
    const isScheduledEmail = sendMsg === "ss:schedule-email";

    if (isScheduledEmail) {
      // 定时邮件：先发送请求获取 taskId，然后保存记录
      ipcRenderer.send(sendMsg, params);

      // 监听定时邮件创建结果
      ipcRenderer.once(
        resultMsg,
        async (
          _: unknown,
          result: { status: string; data?: { taskId: string }; error?: string }
        ) => {
          if (result.status === "pending" && result.data?.taskId) {
            // 定时任务创建成功，保存记录到数据库
            const record = {
              sender: "当前用户",
              content: params.content,
              subject: params.title,
              status: EmailStatus.PENDING,
              recipients: params.sendToWho,
              emailType: "定时邮件",
              taskId: result.data.taskId,
            };

            try {
              await indexedDBUtil.saveEmailRecord(record);
              message.success("定时邮件任务创建成功");
              props.onSuccess?.(result.data.taskId);
            } catch (error) {
              console.error("保存定时邮件记录失败:", error);
              message.error("保存定时邮件记录失败");
            }
          } else {
            // 定时任务创建失败
            message.error(
              `定时邮件任务创建失败: ${result.error || "未知错误"}`
            );
          }
        }
      );
    } else {
      // 即时邮件：先保存记录，然后发送邮件
      const record = {
        sender: "当前用户",
        content: params.content,
        subject: params.title,
        status: EmailStatus.PENDING,
        recipients: params.sendToWho,
        emailType: "即时邮件",
      };

      indexedDBUtil
        .saveEmailRecord(record)
        .then((taskId) => {
          // 发送邮件
          ipcRenderer.send(sendMsg, { ...params, taskId });

          // 监听发送结果
          ipcRenderer.once(
            resultMsg,
            async (_: unknown, result: EmailSendResult) => {
              await indexedDBUtil.updateEmailRecordByTaskId(taskId, {
                status: result.status,
                sendTime: new Date().toISOString(),
              });
              if (result.status === EmailStatus.SUCCESS) {
                message.success("邮件发送成功");
              } else if (result.status === EmailStatus.FAILED) {
                message.error(`邮件发送失败: ${result.error}`);
              }
              props.onSuccess?.(taskId);
            }
          );
        })
        .catch((error) => {
          console.error("保存邮件记录失败:", error);
          message.error("保存邮件记录失败");
        });
    }

    setOpen(false);
  };
  // 定时发送
  const handleRegulartimeSend = () => {
    return formRef?.validateFields().then((res) => {
      const params = {
        ...res,
        sendToWho: res?.sendToWho?.replace(/\s*/g, ""), //去除所有空格
      };
      handleEmailRecord(params, "ss:schedule-email", "ss:schedule-email-reply");
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
        initialValue: false,
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
        destroyOnHidden
        footer={
          formRef.getFieldValue("regularlySend")
            ? [
                <Button key="cancel" onClick={handleCancel}>
                  取消
                </Button>,
                <Button
                  key="schedule"
                  type="primary"
                  danger
                  onClick={handleRegulartimeSend}
                >
                  定时发送
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={handleCancel}>
                  取消
                </Button>,
                <Button key="send" type="primary" onClick={handleOk}>
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
