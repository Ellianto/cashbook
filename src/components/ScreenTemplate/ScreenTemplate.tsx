import React from "react";

import { Layout, Row, Col, Typography } from "antd";

import { NavigationBar } from "../NavigationBar";
import './ScreenTemplate.css'

interface ScreenTemplateProps {
  title: string;
  leftButton?: JSX.Element | undefined;
  rightButton?: JSX.Element | undefined;
  children?: React.ReactNode;
}

const { Title } = Typography;
const { Header, Content, Footer } = Layout;

export const ScreenTemplate: React.FC<ScreenTemplateProps> = (props) => {
  const { children, title, leftButton, rightButton } = props;

  return (
    <Layout>
      <Header className="app-bar">
        <Row align="middle" justify="space-between" wrap={false} className="app-bar-content">
          <Col className="text-center" flex="0 0 56px">{leftButton}</Col>
          <Col flex="1 0 auto">
            <Title className="app-bar-title" level={1}>{title ?? "Screen Title"}</Title>
          </Col>
          <Col className="text-center" flex="0 0 56px">{rightButton}</Col>
        </Row>
      </Header>
      <Content className="content-container">{children}</Content>
      <Footer className="bottom-nav-bar">
        <NavigationBar />
      </Footer>
    </Layout>
  );
};