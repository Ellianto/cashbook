import React, { useEffect } from "react";
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";

import { useAuthState } from "react-firebase-hooks/auth";
import { Layout } from "antd";

import {
  HomeScreen,
  TransactionFormScreen,
  DashboardScreen,
  CategoryScreen,
  AuthScreen,
} from "./screens";

import { routes } from "./constants";

import { firebaseAuth } from "./firebase";

const AppShell: React.FC = () => (
  <Layout className="app-shell">
    <Outlet />
  </Layout>
);

const App: React.FC = () => {
  const navigate = useNavigate();

  const [user, loading, err] = useAuthState(firebaseAuth);

  if (err) {
    console.error(err);
  }

  useEffect(() => {
    if (!loading) {
      if (user) navigate(routes.HOME);
      else navigate(routes.LOGIN);
    }
  }, [loading, user]);

  return (
    <div className="container">
      <Routes>
        <Route element={<AppShell />}>
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
        <Route path={routes.LOGIN} element={<AuthScreen />} />
      </Routes>
    </div>
  );
};

export default App;
