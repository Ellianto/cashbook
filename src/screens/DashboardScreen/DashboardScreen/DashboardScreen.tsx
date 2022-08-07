import React, { useState, useCallback, useEffect} from "react";
import moment from "moment";
import {
  Row, 
  Col,
  Spin,
  Radio,
  Button,
  Typography,
  Segmented,
  DatePicker,
  RadioChangeEvent,
} from 'antd';

import { ScreenTemplate } from '../../../components'

import { OperationalCategory, ProductInventory, TransactionItem, TransactionsData } from "../../../constants/interfaces";
import { GetOperationalsResponse, GetProductsResponse, GetTransactionsResponse } from "../../../constants/responses";

import { getOperationalsMethod, getProductsMethod, getTransactionsListMethod } from "../../../firebase";
import { handleFirebaseError, dateFormatting } from "../../../utils";

import { TransactionsListView } from "../TransactionsListView";
import { SummaryView } from "../SummaryView";

import "./DashboardScreen.css"

const {Text} = Typography;

const DASHBOARD_VIEWS = {
  LIST: "LIST",
  SUMMARY: "SUMMARY",
}

const DATE_INTERVALS = {
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  THIS_QUARTER: "THIS_QUARTER",
  LAST_QUARTER: "LAST_QUARTER",
  CUSTOM: "CUSTOM",
}

type DashboardViewKeys = keyof typeof DASHBOARD_VIEWS;
type DashboardViewValues = typeof DASHBOARD_VIEWS[DashboardViewKeys]

type DateIntervalKeys = keyof typeof DATE_INTERVALS;
type DateIntervalValues = typeof DATE_INTERVALS[DateIntervalKeys]

const dashboardViewOptions = [
  {
    label: "List Detail",
    value: DASHBOARD_VIEWS.LIST,
  },
  {
    label: "Rekap",
    value: DASHBOARD_VIEWS.SUMMARY,
  },
];

const dateIntervalOptions = [
  { 
    label: "Bulan ini",
    value: DATE_INTERVALS.THIS_MONTH,
  },
  { 
    label: "Bulan lalu",
    value: DATE_INTERVALS.LAST_MONTH,
  },
  { 
    label: "Kuartal ini",
    value: DATE_INTERVALS.THIS_QUARTER,
  },
  { 
    label: "Kuartal lalu",
    value: DATE_INTERVALS.LAST_QUARTER,
  },
  { 
    label: "Custom",
    value: DATE_INTERVALS.CUSTOM,
  },
];


export const DashboardScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [dashboardView, setDashboardView] = useState<DashboardViewValues>(DASHBOARD_VIEWS.LIST)
  const [dateInterval, setDateInterval] = useState<DateIntervalValues | null>(null)
  const [startDate, setStartDate] = useState<moment.Moment | null>(null);
  const [endDate, setEndDate] = useState<moment.Moment | null>(null);

  const [startFetching, setStartFetching] = useState<boolean>(false)
  // Null means we haven't fetched yet
  const [transactionsList, setTransactionsList] = useState<TransactionsData[] | null>(null)
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [operationals, setOperationals] = useState<OperationalCategory[]>([])

  const fetchOperationals = useCallback(async () => {
    if (operationals.length > 0) return;

    setIsLoading(true);
    try {
      const { data } = await getOperationalsMethod();
      if (data) {
        const operationalsData = (data as GetOperationalsResponse).operationals;
        setOperationals(operationalsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsLoading(false);
  }, [operationals.length]);

  const fetchProducts = useCallback(async () => {
    if (products.length > 0) return;

    setIsLoading(true);
    try {
      const { data } = await getProductsMethod();
      if (data) {
        const productsData = (data as GetProductsResponse).products;
        setProducts(productsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsLoading(false);
  }, [products.length]);

  const fetchTransactionsData = useCallback(async (startDate : moment.Moment, endDate : moment.Moment) => {
    setIsLoading(true);
    try {
      const { data } = await getTransactionsListMethod({
        start_date : dateFormatting.formatForStorage(startDate) ,
        end_date : dateFormatting.formatForStorage(endDate),
      });
      if (data) {
        const txnsData = (data as GetTransactionsResponse).transactions;
        setTransactionsList(txnsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsLoading(false);
  }, [])

  useEffect(() => {
    fetchOperationals();
    fetchProducts();
  }, [fetchOperationals, fetchProducts]);

  useEffect(() => {
    if (startFetching && startDate && endDate) {
      fetchTransactionsData(startDate, endDate)
      setStartFetching(false);
    }
  }, [startDate, endDate, startFetching, fetchTransactionsData]);

  useEffect(() => {
    setDateInterval(null)
  }, [dashboardView]);

  const getProductsName = useCallback((item : TransactionItem) => {
    if (products.length === 0) {
      return item.category_id;
    }

    const foundProduct = products.find((product) => product.id === item.category_id);
    if (foundProduct) {
      return foundProduct.name
    }
    return item.category_id;
  }, [products])

  const getOperationalsName = useCallback((item : TransactionItem) => {
    if (operationals.length === 0) {
      return item.category_id;
    }

    const foundOps = operationals.find((ops) => ops.id === item.category_id);
    if (foundOps) {
      return foundOps.name
    }
    return item.category_id;
  }, [operationals])

  const handleDateIntervalChanged = useCallback((e : RadioChangeEvent) => {
    setDateInterval(e.target.value)

    const today = moment().startOf('day')
    switch (e.target.value) {
      case DATE_INTERVALS.THIS_MONTH:
        setStartDate(moment(today).startOf('month'))
        setEndDate(moment(today).endOf('month'))
        break;
      case DATE_INTERVALS.LAST_MONTH:
        const lastMonth = moment(today).subtract(1, 'month').startOf('month')
        setStartDate(lastMonth)
        setEndDate(moment(lastMonth).endOf('month'))
        break;
      case DATE_INTERVALS.THIS_QUARTER:
        setStartDate(moment(today).startOf('quarter'))
        setEndDate(moment(today).endOf('quarter'))
        break;
      case DATE_INTERVALS.LAST_QUARTER:
        const lastQuarter = moment(today).subtract(1, 'quarter').startOf('quarter')
        setStartDate(lastQuarter)
        setEndDate(moment(lastQuarter).endOf('quarter'))
        break;
    
      default:
        setStartDate(null);
        setEndDate(null);
        break;
    }

    if (e.target.value !== DATE_INTERVALS.CUSTOM) {
      setStartFetching(true)
    }
  }, []);

  const handleStartDateChanged = useCallback((date : moment.Moment | null, _ : string) => {
    setStartDate(date)
    setEndDate(null)
  }, []);

  const handleEndDateChanged = useCallback((date : moment.Moment | null, _ : string) => {
    setEndDate(date)
  }, [])

  const handleDisabledEndDate = useCallback((currDate : moment.Moment) => startDate ? !currDate.isSameOrAfter(startDate) : true, [startDate])

  const handleSubmitDateRange = useCallback(() => {
    setStartFetching(true)
  }, []);

  return (
    <ScreenTemplate title="Dashboard">
      <Spin spinning={isLoading}>
        <div className="screen-container">
        <Segmented
            options={dashboardViewOptions}
            onChange={(value) => setDashboardView(`${value}`)}
            value={dashboardView}
            block
            size="large"
          />

          <Text>Pilih interval</Text>
          <Radio.Group 
            optionType="button"
            className="date-interval-buttons"
            value={dateInterval}
            options={dateIntervalOptions} 
            onChange={handleDateIntervalChanged}
          />
          {dateInterval === DATE_INTERVALS.CUSTOM && (
            <Row align="middle" justify="space-around" className="date-picker-container">
              <Col xs={10}>
                <DatePicker 
                  mode="date"
                  placeholder="Tanggal awal"
                  value={startDate}
                  onChange={handleStartDateChanged}
                />
              </Col>
              <Col xs={10}>
                <DatePicker 
                  mode="date"
                  placeholder="Tanggal akhir"
                  value={endDate}
                  onChange={handleEndDateChanged}
                  disabled={!startDate}
                  disabledDate={handleDisabledEndDate}
                />
              </Col>
              <Col xs={4}>
                <Button className="date-submit-btn" block type="primary" onClick={handleSubmitDateRange}>
                  Submit
                </Button>
              </Col>
            </Row>
          )}

          {/* 
            TODO: Technically FE can also calculate summary, from the transactionsList,
            so this can be a workaround if too many reads to Firestore is being done 
            due to calling Cloud Functions just for the summary
          */}
          {transactionsList === null ? null : 
          (dashboardView === DASHBOARD_VIEWS.LIST ? (
            <TransactionsListView 
              data={transactionsList}
              getOperationalsName={getOperationalsName}
              getProductsName={getProductsName}
              triggerRefetch={handleSubmitDateRange}
              startDate={startDate ? dateFormatting.formatForStorage(startDate) : ""}
              endDate={endDate ? dateFormatting.formatForStorage(endDate) : ""}
            />
          ) : dashboardView === DASHBOARD_VIEWS.SUMMARY ?  (
            <SummaryView 
              data={transactionsList}
              getOperationalsName={getOperationalsName}
              getProductsName={getProductsName}  
            />
          ) : null)}
        </div>
      </Spin>
    </ScreenTemplate>
  );
};
