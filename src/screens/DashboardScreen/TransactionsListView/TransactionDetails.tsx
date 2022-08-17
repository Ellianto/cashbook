import React, { useCallback, useEffect, useState } from 'react';
import numeral from "numeral";

import { Form, Drawer, Descriptions, Typography, Row, Col, Button, Spin, message, Popconfirm } from 'antd';

import { CalculatorInput } from "../../../components";

import { constants, formRules } from '../../../constants';
import { TransactionItem } from '../../../constants/interfaces';
import { DeleteTransactionPayload, EditTransactionPayload } from '../../../constants/payloads';

import { dateFormatting, handleFirebaseError, numberFormatting } from '../../../utils';
import { deleteTransactionMethod, editTransactionMethod } from '../../../firebase';

const { TRANSACTION_TYPES, CATEGORY_TYPES } = constants

const { Text } = Typography;
const { number } = formRules;

interface TransactionDetailsProps {
  visible: boolean
  txDetails: TransactionItem
  txDate: string
  closeDrawer: (shouldRefetch: boolean) => void
  getProductsName?: (item: TransactionItem) => string
  getOperationalsName?: (item: TransactionItem) => string
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = (props) => {
  const [formInstance] = Form.useForm()

  const qtyValue = Form.useWatch('qty', formInstance);
  const priceValue = Form.useWatch('amount', formInstance);

  const { visible, txDetails, txDate, closeDrawer, getProductsName = () => '', getOperationalsName = () => '' } = props

  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (visible && txDetails) {
      formInstance.setFieldsValue({
        amount: txDetails.amount,
        qty: txDetails.qty ?? 0,
      })
    } else {
      formInstance.resetFields()
    }
  }, [visible, txDetails, formInstance]);

  const handleQtyInputChanged = useCallback((newQty: number) => {
    formInstance.setFieldsValue({
      ...formInstance.getFieldsValue(),
      qty: newQty,
    })
  }, [formInstance]);

  const handlePriceInputChanged = useCallback((newPrice: number) => {
    formInstance.setFieldsValue({
      ...formInstance.getFieldsValue(),
      amount: newPrice,
    })
  }, [formInstance]);

  const handleDeleteTransaction = useCallback(async () => {
    setIsLoading(true);

    try {
      const payload: DeleteTransactionPayload = {
        transaction_date: txDate,
        transaction_id: txDetails.transaction_id,
        transaction_type: txDetails.transaction_type,
        expense_type: txDetails.category_type,
      };

      await deleteTransactionMethod(payload)
      message.success("Transaksi berhasil dihapus!")
      setTimeout(() => {
        closeDrawer(true);
        setIsLoading(false);
      }, 1200)
    } catch (error) {
      handleFirebaseError(error);
      setIsLoading(false);
    }

  }, [txDate, txDetails, closeDrawer])

  const handleEditTransaction = useCallback(async () => {
    setIsLoading(true);

    try {
      const values = formInstance.getFieldsValue();

      let payload: EditTransactionPayload = {
        transaction_date: txDate,
        transaction_id: txDetails.transaction_id,
        transaction_type: txDetails.transaction_type,
        expense_type: txDetails.category_type,
        amount: values.amount,
      };

      if (txDetails.category_type === CATEGORY_TYPES.PRODUCT) {
        payload = {
          ...payload,
          qty: values.qty,
        }
      }

      console.log(payload)

      await editTransactionMethod(payload)
      message.success("Transaksi berhasil diubah!")
      setTimeout(() => {
        closeDrawer(true);
        setIsLoading(false);
      }, 1200)

    } catch (error) {
      handleFirebaseError(error);
      setIsLoading(false);
    }

  }, [txDate, txDetails, formInstance, closeDrawer])

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
        <Form
          layout="vertical"
          className="edit-form"
          scrollToFirstError
          form={formInstance}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
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
              </Descriptions>

              {/* <Descriptions.Item
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
            ) : null} */}
            </Col>

            <Col xs={24}>
              <Form.Item
                className="compact-form-item"
                id="amount"
                name="amount"
                label="Jumlah transaksi"
                rules={number("Jumlah transaksi tidak boleh kosong!")}
              >
                <CalculatorInput 
                  key="price_input"
                  initialValue={priceValue ?? 0}
                  onChange={handlePriceInputChanged}
                  inputNumberProps={{
                    className: "block-input",
                    min: 0 as number,
                    precision: 1,
                    addonBefore: "Rp",
                    size: "large",
                    placeholder: "Masukkan kuantitas barang",
                    parser: (displayValue: string | undefined) => numeral(displayValue).value() ?? 0,
                    formatter: (value: number | undefined, _: any) => numberFormatting.formatIDRCurrencyNumber(value ?? 0),
                  }}
                />
              </Form.Item>
              <Form.Item
                className="compact-form-item"
                id="qty"
                name="qty"
                label="Kuantitas barang"
                hidden={txDetails.category_type === CATEGORY_TYPES.OPERATIONAL}
                rules={
                  txDetails.category_type === CATEGORY_TYPES.PRODUCT
                    ? number("Kuantitas barang tidak boleh kosong!", 0.1)
                    : []
                }
              >
                <CalculatorInput 
                  key="qty_input"
                  initialValue={qtyValue ?? 0}
                  onChange={handleQtyInputChanged}
                  inputNumberProps={{
                    className: "block-input",
                    min: 0.1,
                    step: 0.1,
                    precision: 1,
                    addonAfter: "kg",
                    size: "large",
                    placeholder: "Masukkan kuantitas barang",
                  }}
                />
              </Form.Item>
              {/* <Form.Item
                className="compact-form-item"
                id="amount"
                name="amount"
                label="Jumlah transaksi"
                rules={number("Jumlah transaksi tidak boleh kosong!")}
              >
                <InputNumber
                  className="block-input"
                  min={0 as number}
                  step={1}
                  addonBefore="Rp"
                  size="large"
                  placeholder="Masukkan jumlah transaksi"
                  parser={(displayValue) => numeral(displayValue).value() ?? 0}
                  formatter={(value, _) => numberFormatting.formatIDRCurrencyNumber(value ?? 0)}
                />
              </Form.Item>
              <Form.Item
                className="compact-form-item"
                id="qty"
                name="qty"
                label="Kuantitas barang"
                hidden={txDetails.category_type === CATEGORY_TYPES.OPERATIONAL}
                rules={
                  txDetails.category_type === CATEGORY_TYPES.PRODUCT
                    ? number("Kuantitas barang tidak boleh kosong!", 0.1)
                    : []
                }
              >
                <InputNumber
                  className="block-input"
                  min={0.1}
                  step={0.1}
                  precision={1}
                  addonAfter="kg"
                  size="large"
                  placeholder="Masukkan kuantitas barang"
                />
              </Form.Item> */}
            </Col>

            <Col xs={12}>
              <Button block type="primary" onClick={handleEditTransaction}>
                Update Transaksi
              </Button>
            </Col>
            <Col xs={12}>
              <Popconfirm
                title="Yakin ingin menghapus transaksi?"
                onConfirm={handleDeleteTransaction}
                okType="danger"
              >
                <Button block type="primary" danger>
                  Hapus Transaksi
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Drawer>
  )
}