import React, { useCallback, useState, useEffect } from "react";

import {
  DatePicker,
  Form,
  Spin,
  Select,
  InputNumber,
  Modal,
  Button,
  Radio,
  RadioChangeEvent,
  Row,
  Col,
  message,
} from "antd";
import moment from "moment";

import { BackButton, ScreenTemplate } from "../../components";
import { CATEGORY_TYPES, TRANSACTION_TYPES } from "../../constants/constants";
import {
  OperationalCategory,
  ProductInventory,
  TransactionTypeValues,
  CategoryTypeValues,
} from "../../constants/interfaces";
import { formRules } from "../../constants";

import { getOperationalsMethod, getProductsMethod } from "../../firebase";
import { handleFirebaseError } from "../../utils";
import {
  GetOperationalsResponse,
  GetProductsResponse,
} from "../../constants/responses";

import "./TransactionsFormScreen.css";

interface TransactionFormValues {
  transactionCategoryID: string;
  amount: number;
  stock?: number;
  notes?: string;
}

const { required, number } = formRules;

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
    if (operationals.length === 0) return;

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
  }, [operationals]);

  const fetchProducts = useCallback(async () => {
    if (products.length === 0) return;

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
  }, [products]);

  useEffect(() => {
    if (expenseType === CATEGORY_TYPES.OPERATIONAL) {
      fetchOperationals();
    } else {
      fetchProducts();
    }
  }, [expenseType, fetchOperationals, fetchProducts]);

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

  const submitTransactionData = useCallback(
    (values: TransactionFormValues) => {
      setIsLoading(true);

      try {
        console.log(values);
      } catch (error) {
        handleFirebaseError(error);
      }

      setIsLoading(false);
    },
    [transactionDate]
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
        content:
          "Here we try providing a very long content to see how the padding and the size matters",
        onOk: () => submitTransactionData(values),
      });
    },
    [transactionDate, submitTransactionData]
  );

  return (
    <ScreenTemplate title="Transaksi" leftButton={<BackButton />}>
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
                type="success"
                className="green block-radio-btn"
                value={TRANSACTION_TYPES.DEBIT}
              >
                Pemasukan
              </Radio.Button>
              <Radio.Button
                className="red block-radio-btn"
                value={TRANSACTION_TYPES.CREDIT}
              >
                Pengeluaran
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            className="compact-form-item"
            id="expense_status"
            label="Jenis Pengeluaran"
            hidden={transactionType === TRANSACTION_TYPES.DEBIT}
            required={true}
          >
            <Radio.Group
              className="block-input"
              value={expenseType}
              onChange={handleExpenseTypeChanged}
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
                      value: category.name,
                    }))
                  : products.map((product: ProductInventory) => ({
                      label: product.name,
                      value: product.name,
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
              min={0}
              step={1}
              addonBefore="Rp"
              size="large"
              placeholder="Masukkan jumlah transaksi"
            />
          </Form.Item>
          <Form.Item
            className="compact-form-item"
            id="stock"
            name="stock"
            label="Kuantitas barang"
            hidden={expenseType === CATEGORY_TYPES.OPERATIONAL}
            rules={
              expenseType === CATEGORY_TYPES.PRODUCT
                ? number("Kuantitas barang tidak boleh kosong!")
                : []
            }
          >
            <InputNumber
              className="block-input"
              min={0}
              step={0.01}
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
