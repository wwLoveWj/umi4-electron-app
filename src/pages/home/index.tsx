import { history } from "umi";
import { useState, useEffect } from "react";
import { Card, Row, Col, Radio, Tabs } from "antd";
import {
  MailOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
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
  const [chartStyle, setChartStyle] = useState<"bar" | "pie" | "scatter">(
    "bar"
  );

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

    const baseOption = {
      title: {
        text: chartType === "daily" ? "每日邮件发送统计" : "每月邮件发送统计",
        left: "center",
      },
      tooltip: {
        trigger: chartStyle === "pie" ? "item" : "axis",
      },
    };

    if (chartStyle === "pie") {
      return {
        ...baseOption,
        series: [
          {
            type: "pie",
            radius: "50%",
            data: xAxisData.map((name, index) => ({
              name,
              value: seriesData[index],
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };
    }

    if (chartStyle === "scatter") {
      return {
        ...baseOption,
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
            type: "scatter",
            data: seriesData,
            symbolSize: (data: number) => data * 2,
            itemStyle: {
              color: "#1890ff",
            },
          },
        ],
      };
    }

    return {
      ...baseOption,
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

  const items = [
    {
      key: "bar",
      label: (
        <span>
          <BarChartOutlined />
          柱状图
        </span>
      ),
    },
    {
      key: "pie",
      label: (
        <span>
          <PieChartOutlined />
          扇形图
        </span>
      ),
    },
    {
      key: "scatter",
      label: (
        <span>
          <DotChartOutlined />
          散点图
        </span>
      ),
    },
  ];

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
          styles={{
            body: {
              padding: "16px",
            },
          }}
        >
          <Row gutter={16}>
            <Col span={4}>
              <Tabs
                activeKey={chartStyle}
                onChange={(key) =>
                  setChartStyle(key as "bar" | "pie" | "scatter")
                }
                items={items}
                tabPosition="left"
                style={{ height: "400px" }}
              />
            </Col>
            <Col span={20}>
              <ReactECharts
                option={getChartOption()}
                style={{ height: "400px" }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
