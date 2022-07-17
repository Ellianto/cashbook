import React from "react";

import { Routes, Route, Outlet } from "react-router-dom";

import { Layout } from "antd";

import { NavigationBar } from "./components";

import { HomeScreen, TransactionFormScreen, DashboardScreen, InventoryScreen } from './screens'

import { routes } from "./constants";

import "./App.css";

const AppShell: React.FC = () => (
  <Layout className="app-shell">
    <NavigationBar />
    <Outlet />
  </Layout>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* TODO: Check if Index and Path can be used at the same time */}
        <Route index element={<HomeScreen />} />
        <Route path={routes.HOME} element={<HomeScreen />} />
        <Route
          path={routes.TRANSACTIONS}
          element={<TransactionFormScreen />}
        />
        <Route path={routes.DASHBOARD} element={<DashboardScreen />} />
        <Route path={routes.INVENTORY} element={<InventoryScreen />} />
      </Route>
      {/* TODO: Add auth screen later */}
      {/* <Route exact path="/login" element={<AuthScreen />} /> */}
    </Routes>
  );
};

export default App;
