import React, { useCallback, useState } from 'react';

import { Drawer, Descriptions, Typography, Row, Col, Button, Spin, message } from 'antd';

import { constants } from '../../../constants';
import { TransactionItem } from '../../../constants/interfaces';

import { dateFormatting, handleFirebaseError, numberFormatting } from '../../../utils';
import { DeleteTransactionPayload } from '../../../constants/payloads';
import { deleteTransactionMethod } from '../../../firebase';

const { TRANSACTION_TYPES, CATEGORY_TYPES } = constants

const { Text } = Typography;

interface TransactionDetailsProps {
  visible: boolean
  txDetails : TransactionItem
  txDate : string
  closeDrawer: (shouldRefetch : boolean) => void
  getProductsName?: (item : TransactionItem) => string
  getOperationalsName?: (item : TransactionItem) => string
}

export const TransactionDetails : React.FC<TransactionDetailsProps> = (props) => {
  const { visible, txDetails, txDate, closeDrawer, getProductsName = () => '', getOperationalsName = () => '' } = props

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleDeleteTransaction = useCallback(async () => {
    setIsLoading(true);

    try {
      const payload : DeleteTransactionPayload = {
        transaction_date : txDate,
        transaction_id : txDetails.transaction_id,
        transaction_type: txDetails.transaction_type,
        expense_type: txDetails.category_type,
      };

      await deleteTransactionMethod(payload)
      message.success("Transaksi berhasil dihapus!")
      closeDrawer(true);
    } catch (error) {
      handleFirebaseError(error);
    }

    setIsLoading(false);
  }, [txDate, txDetails, closeDrawer])

  return (
    <Drawer
      height={480}
      closable={true}
      visible={visible}
      placement="bottom"
      onClose={() => closeDrawer(false)}
      title="Detail Transaksi"
      bodyStyle={{ padding: 10 }}
    >
      <Spin spinning={isLoading}>

          <Row gutter={[8, 20]}>
            <Col xs={24}>
            <Descriptions bordered size="middle">
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
            </Col>
            <Col xs={12}></Col>
            <Col xs={12}>
              <Button block type="primary" danger onClick={handleDeleteTransaction}>
                Hapus Transaksi
              </Button>
            </Col>
          </Row>
      </Spin>

    </Drawer>
  )
}