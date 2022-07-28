import React from 'react';

import { Drawer, Descriptions, Typography } from 'antd';

import { constants } from '../../../constants';
import { TransactionItem } from '../../../constants/interfaces';

import { dateFormatting, numberFormatting } from '../../../utils';

const { TRANSACTION_TYPES, CATEGORY_TYPES } = constants

const { Text } = Typography;

interface TransactionDetailsProps {
  visible: boolean
  txDetails : TransactionItem
  txDate : string
  closeDrawer: () => void
  getProductsName?: (item : TransactionItem) => string
  getOperationalsName?: (item : TransactionItem) => string
}

export const TransactionDetails : React.FC<TransactionDetailsProps> = (props) => {
  const { visible, txDetails, txDate, closeDrawer, getProductsName = () => '', getOperationalsName = () => '' } = props

  return (
    <Drawer
      height={480}
      closable={true}
      visible={visible}
      placement="bottom"
      onClose={closeDrawer}
      title="Detail Transaksi"
      bodyStyle={{ padding: 10 }}
    >
      <Descriptions bordered size="middle"
          >
            <Descriptions.Item
              className="description-label"
              label="Tanggal Transaksi"
            >
              {dateFormatting.formatForHumanDisplay(txDate)}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label="Jenis Transaksi"
            >
              <Text
                type={
                  txDetails.transaction_type === TRANSACTION_TYPES.CREDIT
                    ? "danger"
                    : "success"
                }
              >
                {txDetails.transaction_type === TRANSACTION_TYPES.CREDIT
                  ? "Pengeluaran"
                  : "Pemasukan"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label={`Kategori ${txDetails.transaction_type === TRANSACTION_TYPES.CREDIT ? 'Pengeluaran' : 'Pemasukan'}`}
            >
              {txDetails.category_type === CATEGORY_TYPES.PRODUCT
                ? "Produk"
                : "Operasional"}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label="Nama Kategori/Produk"
            >
              {txDetails.category_type === CATEGORY_TYPES.PRODUCT
                ? getProductsName(txDetails)
                : getOperationalsName(txDetails)}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label={`Jumlah ${txDetails.transaction_type === TRANSACTION_TYPES.CREDIT ? 'Pengeluaran' : 'Pemasukan'}`}
            >
              Rp. {numberFormatting.formatIDRCurrencyNumber(txDetails.amount)}
            </Descriptions.Item>
            {txDetails.category_type === CATEGORY_TYPES.PRODUCT && txDetails.qty ? (
              <Descriptions.Item
                className="description-label"
                label="Kuantitas Produk"
              >
                {txDetails.qty} kg
              </Descriptions.Item>
            ) : null}
          </Descriptions>
    </Drawer>
  )
}