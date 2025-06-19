/**
 * @file 代码树工具页面
 * @description 用于管理和展示代码片段的树形结构
 */
import React from "react";
import { Layout } from "antd";
import CodeTree from "./components/CodeTree";

const { Content } = Layout;

/**
 * 代码树工具页面
 */
const CodeTreePage: React.FC = () => {
  return (
    <Layout style={{ height: "100vh" }}>
      <Content>
        <CodeTree />
      </Content>
    </Layout>
  );
};

export default CodeTreePage;
