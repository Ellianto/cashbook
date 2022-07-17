import React from "react";

import { BackButton, ScreenTemplate} from '../../components'

export const DashboardScreen = () => {
  return (
    <ScreenTemplate title="Rekap" leftButton={<BackButton />}>
      <h1>This will be a simple dashboard screen for reviewing transactions</h1>
    </ScreenTemplate>
  );
};
