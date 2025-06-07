import { history } from "umi";
import { useState } from "react";
import { Card } from "antd";
import { MailOutlined } from "@ant-design/icons";

export default function Home() {
  const [toolList] = useState([
    {
      title: "邮件发送",
      extra: "设置",
    },
  ]);
  return (
    <div>
      {toolList?.map((item) => (
        <Card
          title={item?.title}
          extra={<a href="#">设置</a>}
          style={{ maxWidth: 300 }}
          onClick={() =>
            history.push({ pathname: "/mail/send" }, { editorId: "" })
          }
        >
          <MailOutlined />
        </Card>
      ))}
    </div>
  );
}
