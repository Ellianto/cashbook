import React from "react";

import { BackButton, ScreenTemplate} from '../../components'

export const InventoryScreen = () => {
  return (
    <ScreenTemplate title="Inventory" leftButton={<BackButton />}>
      <h1>This will be the page where you can see info about current stock + average buy price</h1>
    </ScreenTemplate>
  );
};
