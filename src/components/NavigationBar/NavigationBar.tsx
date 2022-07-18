import React from "react";

import { useNavigate, NavLink } from "react-router-dom";

import { Button, Grid, Row, Col } from "antd";

import { navbarItems } from "../../constants";

import "./NavigationBar.css";

const { useBreakpoint } = Grid;

// A little custom navbar, since we want the experience of
// bottom tab navigation on mobile view
export const NavigationBar = () => {
  const { md } = useBreakpoint();
  const navigate = useNavigate();

  return (
    <>
      {/* 
        We don't really care much about desktop for now
        Hiding due to UI flickering on mobile view
        <Sider collapsedWidth={0} breakpoint="md" trigger={null}>
          <div className="logo" />
          <Menu
            onSelect={(info) => navigate(info.key)}
            theme="dark"
            mode="inline"
            items={navbarItems}
          />
        </Sider>
       */}
      {!md && (
        <div className="bottom-tab-bar">
          <Row align="middle" justify="space-around">
            {navbarItems.map((item) =>
              item ? (
                <NavLink key={item.key} to={item.key}>
                  <Col xs={6}>
                    <Button
                      type="text"
                      icon={item.icon}
                      onClick={() => navigate(item.key)}
                      className="bottom-tab-button"
                    />
                  </Col>
                </NavLink>
              ) : null
            )}
          </Row>
        </div>
      )}
    </>
  );
};
