import React, { useState } from "react";
import { Card, Form, Select, Input, Button, Space, Typography } from "antd";
import cronstrue from "cronstrue";
import "cronstrue/locales/zh_CN";

const { Option } = Select;
const { Text } = Typography;

/**
 * Cron 表达式生成器组件
 * @returns React 组件
 */
const CronGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [cronExpression, setCronExpression] = useState<string>("");
  const [cronDescription, setCronDescription] = useState<string>("");

  /**
   * 生成 Cron 表达式
   */
  const generateCron = () => {
    const values = form.getFieldsValue();
    const { second, minute, hour, day, month, week } = values;

    // 构建 cron 表达式
    const expression = `${second} ${minute} ${hour} ${day} ${month} ${week}`;
    setCronExpression(expression);
  };

  /**
   * 解析 Cron 表达式
   */
  const parseCron = () => {
    try {
      const description = cronstrue.toString(cronExpression, {
        locale: "zh_CN",
        use24HourTimeFormat: true,
        dayOfWeekStartIndexZero: false,
      });
      setCronDescription(description);
    } catch (error) {
      setCronDescription("无效的 Cron 表达式");
    }
  };

  return (
    <Card title="Cron 表达式生成器" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          second: "*",
          minute: "*",
          hour: "*",
          day: "*",
          month: "*",
          week: "?",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Form.Item label="秒" name="second">
            <Select>
              <Option value="*">每秒</Option>
              <Option value="0">0秒</Option>
              <Option value="30">30秒</Option>
            </Select>
          </Form.Item>

          <Form.Item label="分钟" name="minute">
            <Select>
              <Option value="*">每分钟</Option>
              <Option value="0">0分</Option>
              <Option value="30">30分</Option>
            </Select>
          </Form.Item>

          <Form.Item label="小时" name="hour">
            <Select>
              <Option value="*">每小时</Option>
              <Option value="0">0点</Option>
              <Option value="12">12点</Option>
              <Option value="23">23点</Option>
            </Select>
          </Form.Item>

          <Form.Item label="日期" name="day">
            <Select>
              <Option value="*">每天</Option>
              <Option value="1">1号</Option>
              <Option value="15">15号</Option>
              <Option value="L">最后一天</Option>
            </Select>
          </Form.Item>

          <Form.Item label="月份" name="month">
            <Select>
              <Option value="*">每月</Option>
              <Option value="1">1月</Option>
              <Option value="6">6月</Option>
              <Option value="12">12月</Option>
            </Select>
          </Form.Item>

          <Form.Item label="星期" name="week">
            <Select>
              <Option value="?">不指定</Option>
              <Option value="*">每周</Option>
              <Option value="1">周一</Option>
              <Option value="5">周五</Option>
              <Option value="7">周日</Option>
            </Select>
          </Form.Item>

          <Space>
            <Button type="primary" onClick={generateCron}>
              生成表达式
            </Button>
            <Button onClick={parseCron}>解析表达式</Button>
          </Space>

          {cronExpression && (
            <Input.TextArea
              value={cronExpression}
              readOnly
              placeholder="生成的 Cron 表达式将显示在这里"
              style={{ marginTop: 16 }}
            />
          )}

          {cronDescription && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Text strong>表达式说明：</Text>
              <Text>{cronDescription}</Text>
            </Card>
          )}
        </Space>
      </Form>
    </Card>
  );
};

export default CronGenerator;
