import { history } from "umi";
import { useState, useEffect } from "react";
import { Card, Row, Col, Radio } from "antd";
import { MailOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { indexedDBUtil, EmailRecord } from "@/utils/indexedDB";
import dayjs from "dayjs";

export default function Home() {
  const [emailStats, setEmailStats] = useState<{
    daily: { date: string; count: number }[];
    monthly: { month: string; count: number }[];
  }>({
    daily: [],
    monthly: [],
  });

  const [chartType, setChartType] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      const records = await indexedDBUtil.getAllEmailRecords();

      // 按日期统计
      const dailyStats = records.reduce(
        (acc: { [key: string]: number }, record) => {
          const date = dayjs(record.sendTime).format("YYYY-MM-DD");
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {}
      );

      // 按月份统计
      const monthlyStats = records.reduce(
        (acc: { [key: string]: number }, record) => {
          const month = dayjs(record.sendTime).format("YYYY-MM");
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        },
        {}
      );

      setEmailStats({
        daily: Object.entries(dailyStats).map(([date, count]) => ({
          date,
          count,
        })),
        monthly: Object.entries(monthlyStats).map(([month, count]) => ({
          month,
          count,
        })),
      });
    } catch (error) {
      console.error("获取邮件统计数据失败:", error);
    }
  };

  const getChartOption = () => {
    const data = chartType === "daily" ? emailStats.daily : emailStats.monthly;
    const xAxisData = data.map((item) =>
      chartType === "daily"
        ? (item as { date: string; count: number }).date
        : (item as { month: string; count: number }).month
    );
    const seriesData = data.map((item) => item.count);

    return {
      title: {
        text: chartType === "daily" ? "每日邮件发送统计" : "每月邮件发送统计",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "发送数量",
      },
      series: [
        {
          data: seriesData,
          type: "bar",
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.2)",
          },
        },
      ],
    };
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title="邮件发送统计"
          extra={
            <Radio.Group
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <Radio.Button value="daily">每日统计</Radio.Button>
              <Radio.Button value="monthly">每月统计</Radio.Button>
            </Radio.Group>
          }
        >
          <ReactECharts option={getChartOption()} style={{ height: "400px" }} />
        </Card>
      </Col>
    </Row>
  );
}
