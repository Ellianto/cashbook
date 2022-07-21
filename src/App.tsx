import React from "react";

import { Routes, Route, Outlet } from "react-router-dom";

import { Layout } from "antd";

import { HomeScreen, TransactionFormScreen, DashboardScreen, CategoryScreen } from './screens'

import { routes } from "./constants";

import "./App.css";

const AppShell: React.FC = () => (
  <Layout className="app-shell">
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
        <Route path={routes.CATEGORY} element={<CategoryScreen />} />
      </Route>
      {/* TODO: Add auth screen later */}
      {/* <Route exact path="/login" element={<AuthScreen />} /> */}
    </Routes>
  );
};

export default App;
