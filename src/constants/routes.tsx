import React from "react"; // For JSX support

import {
  HomeFilled,
  EditFilled,
  ReconciliationFilled,
  ShopFilled,
} from "@ant-design/icons";

// import type { MenuProps } from "antd";
// type MenuItem = Required<MenuProps>["items"][number];

interface CustomMenuItem {
  label: string;
  key: string;
  icon: JSX.Element;
}

export const routes = {
  HOME: "/home",
  TRANSACTIONS: "/transactions",
  DASHBOARD: "/dashboard",
  CATEGORY: "/category",
  LOGIN: "/login",
};

export const navbarItems: CustomMenuItem[] = [
  {
    label: "Home", // What text will be shown (only on desktop)
    key: routes.HOME, // pathname to be used in Link component
    icon: <HomeFilled />, // Icon to show
  },
  {
    label: "Transaction", // What text will be shown (only on desktop)
    key: routes.TRANSACTIONS, // pathname to be used in Link component
    icon: <EditFilled />, // Icon to show
  },
  {
    label: "Dashboard", // What text will be shown (only on desktop)
    key: routes.DASHBOARD, // pathname to be used in Link component
    icon: <ReconciliationFilled />, // Icon to show
  },
  {
    label: "Kategori", // What text will be shown (only on desktop)
    key: routes.CATEGORY, // pathname to be used in Link component
    icon: <ShopFilled />, // Icon to show
  },
];
