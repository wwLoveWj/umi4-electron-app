const schedule = require("node-schedule");
const notifier = require("node-notifier"); //在 Node.js 中发送跨平台通知的工具
const dayjs = require("dayjs");

// ==================================定时任务：在提醒时间发送提醒邮件======================================
function scheduleTask(ruleConfig, eventExec) {
  // ==============================创建定时提醒=====================================

  let {
    notificationRule, //通知规则
    notificationContent = "9998877", //通知内容
    notificationTitle = "邮件通知提醒",
    notificationTime, //整点通知时间
    taskId = " yyds",
    notificationMode, //通知的方式
    interval,
    endTime,
    startTime,
  } = ruleConfig;
  let rule;
  // //每个15、30、45秒执行
  // rule.second = [15, 30, 45];
  // // 每分钟的第10秒
  // rule.second = 10;
  // // 每小时的第10分钟
  // rule.minute = 10;
  // // 每周四，周五，周六，周天的17点
  // rule.dayOfWeek = [0, new schedule.Range(4, 6)];
  // rule.hour = 17;
  // rule.minute = 0;
  // 间隔多久多久通知
  if (notificationMode === "intervalTime") {
    rule = new schedule.RecurrenceRule();
    // 每小时的第10分钟
    // rule[interval] = Number(notificationTime);
    console.log(interval, "---------interval单位间隔时间------------");
    rule.dayOfWeek = [0, new schedule.Range(1, 6)]; //周一到周日
    rule.hour = Number(notificationTime);
    rule.minute = 1;
  } else if (notificationMode === "isDeadlined") {
    //  拥有开始时间和结束时间
    rule = { start: startTime, end: endTime, rule: notificationRule };
  } else {
    rule = notificationRule;
  }
  console.log(rule, "-----------提醒时间规则格式------------");

  // ==================================定时任务：在提醒时间发送提醒邮件======================================
  schedule.scheduleJob(taskId, rule, (time) => {
    console.log(taskId, "任务id");
    try {
      // 定时提醒时间到了发送邮件
      console.log("定时任务提醒时间", time);
      eventExec();
      notifier.notify({
        title: notificationTitle,
        message: notificationContent,
        sound: "Submarine",
        closeLabel: "CANCEL",
        actions: "OK",
      });
    } catch (error) {
      console.error("Send reminder email error:", error);
    }
  });

  // job.cancel();
  // { hour: 15, minute: 31 }
  // "*/5 * * * * *"
  //每天下午5点21分发送
  //   schedule.scheduleJob({ hour: 15, minute: 31 }, function () {
  //     let sendTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  //     console.log(`✅任务创建成功，执行频率5s，` + sendTime);
  //     sendMail(
  //       "你好呀，我的宝贝老婆！",
  //       "<h1>系统邮件，请勿回复</h1><p>今天你看书了嘛？不看等下回来挨打</p>" +
  //         "<b>发送时间:" +
  //         sendTime +
  //         "</b>"
  //     );
  //   });
}

// 取消任务
function cancelSingleTask(jobId) {
  // schedule.scheduledJobs[jobId]?.cancel();
  console.log("任务取消成功~");
  // schedule.cancelJob(jobId);
  schedule.cancel();
}

module.exports = { scheduleTask, cancelSingleTask };
