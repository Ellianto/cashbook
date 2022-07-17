import React from "react";

import { BackButton, ScreenTemplate} from '../../components'

export const TransactionFormScreen = () => {
  return (
    <ScreenTemplate title="Transaksi" leftButton={<BackButton />}>
      <h1>This will be the page to input stuffs</h1>
    </ScreenTemplate>
  );
};
