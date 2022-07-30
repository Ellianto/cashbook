import React, { useCallback, useState, useEffect } from "react";

import {
  Row,
  Col,
  Form,
  Spin,
  Select,
  Modal,
  Button,
  Radio,
  Typography,
  DatePicker,
  InputNumber,
  Descriptions,
  RadioChangeEvent,
  message,
} from "antd";
import moment from "moment";
import numeral from "numeral";

import { ScreenTemplate } from "../../components";
import {
  OperationalCategory,
  ProductInventory,
  TransactionTypeValues,
  CategoryTypeValues,
} from "../../constants/interfaces";
import {
  GetOperationalsResponse,
  GetProductsResponse,
} from "../../constants/responses";
import { TransactionPayload } from "../../constants/payloads";
import { formRules, constants } from "../../constants";

import {
  getOperationalsMethod,
  getProductsMethod,
  addTransactionsMethod,
} from "../../firebase";
import { dateFormatting, handleFirebaseError, numberFormatting } from "../../utils";

import "./TransactionsFormScreen.css";

interface TransactionFormValues {
  transactionCategoryID: string;
  amount: number;
  qty?: number;
}

const { required, number } = formRules;
const { CATEGORY_TYPES, TRANSACTION_TYPES } = constants;
const { Text } = Typography;

export const TransactionFormScreen = () => {
  const [formInstance] = Form.useForm();

  const [transactionDate, setTransactionDate] = useState<moment.Moment | null>(
    null
  );
  const [transactionType, setTransactionType] = useState<TransactionTypeValues>(
    TRANSACTION_TYPES.CREDIT
  );
  const [expenseType, setExpenseType] = useState<CategoryTypeValues>(
    CATEGORY_TYPES.OPERATIONAL
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [operationals, setOperationals] = useState<OperationalCategory[]>([]);

  const fetchOperationals = useCallback(async () => {
    if (operationals.length > 0) return;

    setIsFetchingOptions(true);
    try {
      const { data } = await getOperationalsMethod();
      if (data) {
        const operationalsData = (data as GetOperationalsResponse).operationals;
        setOperationals(operationalsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsFetchingOptions(false);
  }, [operationals.length]);

  const fetchProducts = useCallback(async () => {
    if (products.length > 0) return;

    setIsFetchingOptions(true);
    try {
      const { data } = await getProductsMethod();
      if (data) {
        const productsData = (data as GetProductsResponse).products;
        setProducts(productsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsFetchingOptions(false);
  }, [products.length]);

  useEffect(() => {
    if (expenseType === CATEGORY_TYPES.OPERATIONAL) {
      fetchOperationals();
    } else {
      fetchProducts();
    }
  }, [expenseType, fetchOperationals, fetchProducts]);

  useEffect(() => {
    formInstance.setFieldsValue({
      ...formInstance.getFieldsValue(),
      transactionCategoryID: undefined,
    });
  }, [expenseType, formInstance]);

  const handleTransactionDateChange = useCallback(
    (momentDate: moment.Moment | null, _: string) => {
      console.log("Selected Date : ", _);
      setTransactionDate(momentDate);
    },
    []
  );

  const handleTransactionTypeChanged = useCallback((e: RadioChangeEvent) => {
    setTransactionType(e.target.value);
  }, []);

  const handleExpenseTypeChanged = useCallback((e: RadioChangeEvent) => {
    setExpenseType(e.target.value);
  }, []);

  const handleDisableDate = useCallback(
    (date: moment.Moment) => date.isAfter(moment()),
    []
  );

  const resetSpecificFields = useCallback(() => {
    formInstance.setFieldsValue({
      amount: undefined,
      qty: undefined,
    });
  }, [formInstance]);

  const submitTransactionData = useCallback(
    async (values: TransactionFormValues) => {
      if (!transactionDate) {
        message.warning("Tanggal transaksi harus diisi!");
        return;
      }

      setIsLoading(true);

      try {
        let payload: TransactionPayload = {
          transaction_date: dateFormatting.formatForStorage(transactionDate),
          transaction_type: transactionType,
          amount: values.amount,
          expense_type: expenseType,
          expense_id: values.transactionCategoryID,
        };

        if (expenseType === CATEGORY_TYPES.PRODUCT) {
          payload = {
            ...payload,
            qty: values.qty,
          };
        }

        await addTransactionsMethod(payload);
        message.success("Transaksi berhasil ditambahkan!");
        resetSpecificFields();
      } catch (error) {
        handleFirebaseError(error);
      }

      setIsLoading(false);
    },
    [transactionDate, transactionType, expenseType, resetSpecificFields]
  );

  const handleFormSubmit = useCallback(
    (values: TransactionFormValues) => {
      if (!transactionDate) {
        message.warning("Tanggal transaksi harus diisi!");
        return;
      }

      Modal.confirm({
        centered: true,
        icon: null,
        title: "Konfirmasi",
        content: (
          <Descriptions
            layout="vertical"
            title="Pastikan data di bawah sudah benar"
          >
            <Descriptions.Item
              className="description-label"
              label="Tanggal Transaksi"
            >
              {dateFormatting.formatSimpleDisplay(transactionDate)}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label="Jenis Transaksi"
            >
              <Text
                type={
                  transactionType === TRANSACTION_TYPES.CREDIT
                    ? "danger"
                    : "success"
                }
              >
                {transactionType === TRANSACTION_TYPES.CREDIT
                  ? "Pengeluaran"
                  : "Pemasukan"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label={`Kategori ${transactionType === TRANSACTION_TYPES.CREDIT ? 'Pengeluaran' : 'Pemasukan'}`}
            >
              {expenseType === CATEGORY_TYPES.PRODUCT
                ? "Produk"
                : "Operasional"}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label="Nama Kategori/Produk"
            >
              {(expenseType === CATEGORY_TYPES.PRODUCT
                ? products.find(
                    (product) => product.id === values.transactionCategoryID
                  )?.name
                : operationals.find(
                    (ops) => ops.id === values.transactionCategoryID
                  )?.name) ?? ""}
            </Descriptions.Item>
            <Descriptions.Item
              className="description-label"
              label={`Jumlah ${transactionType === TRANSACTION_TYPES.CREDIT ? 'Pengeluaran' : 'Pemasukan'}`}
            >
              Rp. {numberFormatting.formatIDRCurrencyNumber(values.amount)}
            </Descriptions.Item>
            {expenseType === CATEGORY_TYPES.PRODUCT && values.qty ? (
              <Descriptions.Item
                className="description-label"
                label="Kuantitas Produk"
              >
                {values.qty} kg
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ),
        onOk: () => submitTransactionData(values),
      });
    },
    [
      transactionDate,
      transactionType,
      expenseType,
      products,
      operationals,
      submitTransactionData,
    ]
  );

  return (
    <ScreenTemplate title="Transaksi">
      <Spin spinning={isLoading}>
        <Form
          layout="vertical"
          className="transaction-form"
          scrollToFirstError
          form={formInstance}
          onFinish={handleFormSubmit}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
          <Form.Item
            id="transaction_date"
            className="compact-form-item"
            label="Tanggal Transaksi"
            required={true}
          >
            <DatePicker
              showToday={true}
              value={transactionDate}
              disabledDate={handleDisableDate}
              onChange={handleTransactionDateChange}
              size="large"
              picker="date"
              className="block-input"
              placeholder="Pilih tanggal transaksi"
            />
          </Form.Item>
          <Form.Item
            className="compact-form-item"
            id="transaction_type"
            label="Jenis Transaksi"
            required={true}
          >
            <Radio.Group
              className="block-input"
              value={transactionType}
              onChange={handleTransactionTypeChanged}
            >
              <Radio.Button
                className="red block-radio-btn"
                value={TRANSACTION_TYPES.CREDIT}
              >
                Pengeluaran
              </Radio.Button>
              <Radio.Button
                type="success"
                className="green block-radio-btn"
                value={TRANSACTION_TYPES.DEBIT}
              >
                Pemasukan
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            className="compact-form-item"
            id="expense_status"
            label="Jenis Kategori"
            required={true}
          >
            <Radio.Group
              className="block-input"
              value={expenseType}
              onChange={handleExpenseTypeChanged}
              buttonStyle="solid"
            >
              <Radio.Button
                className="block-radio-btn"
                value={CATEGORY_TYPES.OPERATIONAL}
              >
                Operasional
              </Radio.Button>
              <Radio.Button
                className="block-radio-btn"
                value={CATEGORY_TYPES.PRODUCT}
              >
                Barang
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            className="compact-form-item"
            id="transactionCategoryID"
            name="transactionCategoryID"
            label="Nama Kategori/Produk"
            rules={required("Nama barang/kategori wajib diisi")}
          >
            <Select
              size="large"
              allowClear={true}
              loading={isFetchingOptions}
              placeholder={`Nama ${
                expenseType === CATEGORY_TYPES.OPERATIONAL
                  ? "Kategori Operasional"
                  : "Barang"
              }`}
              options={
                expenseType === CATEGORY_TYPES.OPERATIONAL
                  ? operationals.map((category: OperationalCategory) => ({
                      label: category.name,
                      value: category.id,
                    }))
                  : products.map((product: ProductInventory) => ({
                      label: product.name,
                      value: product.id,
                    }))
              }
            />
          </Form.Item>
          <Form.Item
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
            hidden={expenseType === CATEGORY_TYPES.OPERATIONAL}
            rules={
              expenseType === CATEGORY_TYPES.PRODUCT
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
          </Form.Item>
          <Form.Item>
            <Row justify="center">
              <Col xs={12}>
                <Button
                  block
                  size="large"
                  className="submit-btn"
                  type="primary"
                  htmlType="submit"
                >
                  Submit
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Spin>
    </ScreenTemplate>
  );
};
