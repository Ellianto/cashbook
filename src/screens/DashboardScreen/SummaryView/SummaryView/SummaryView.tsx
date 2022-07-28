import React, { useState, useMemo, useCallback } from 'react';

import {
  Row,
  Col,
  Card,
  Statistic,
} from 'antd'

import { TransactionsData, TransactionItem,
  ProductAggregateData,
  ProductSummaryData,
  OperationalAggregateData,
  OperationalSummaryData,
  SummaryData,
  TransactionTypeValues,
} from "../../../../constants/interfaces";

import { constants } from "../../../../constants";

import "./SummaryView.css"

import { ProductSummaryBreakdown } from '../ProductSummaryBreakdown';

const { CATEGORY_TYPES, TRANSACTION_TYPES } = constants;

interface SummaryViewProps {
  data: TransactionsData[]
  getProductsName?: (item : TransactionItem) => string
  getOperationalsName?: (item : TransactionItem) => string
}

export const SummaryView : React.FC<SummaryViewProps> = (props) => {
  const { data = [], getProductsName = () => '', getOperationalsName = () => '' } = props

  const [isProductSummaryVisible, setIsProductSummaryVisible] = useState<boolean>(false)
  const [isOpsSummaryVisible, setIsOpsSummaryVisible] = useState<boolean>(false)
  const [selectedSummaryType, setSelectedSummaryType] = useState<TransactionTypeValues>(TRANSACTION_TYPES.CREDIT)
  
  const summaryData : SummaryData = useMemo(() => {
    const productsSummary : ProductSummaryData = {
      sumCredit : 0,
      sumDebit : 0,
      sumQtyIn : 0,
      sumQtyOut : 0,
      products : [],
    };

    const opsSummary : OperationalSummaryData = {
      sumCredit : 0,
      sumDebit : 0,
      operationals: [],
    }

    data.forEach((txData : TransactionsData) => {
      txData.transactions.forEach((internalTxn : TransactionItem) => {
        if (internalTxn.category_type === CATEGORY_TYPES.OPERATIONAL) {
          const targetOpsIdx = opsSummary.operationals.findIndex((ops : OperationalAggregateData) => ops.id === internalTxn.category_id)

          if (internalTxn.transaction_type === TRANSACTION_TYPES.CREDIT) {
            opsSummary.sumCredit += internalTxn.amount;
            if (targetOpsIdx >= 0) {
              opsSummary.operationals[targetOpsIdx].sumCredit += internalTxn.amount;
            } else {
              opsSummary.operationals.push({
                id : internalTxn.category_id,
                name: getOperationalsName(internalTxn),
                sumCredit: internalTxn.amount,
                sumDebit: 0,
              })
            }
          } else {
            opsSummary.sumDebit += internalTxn.amount;
            if (targetOpsIdx >= 0) {
              opsSummary.operationals[targetOpsIdx].sumDebit += internalTxn.amount;
            } else {
              opsSummary.operationals.push({
                id : internalTxn.category_id,
                name: getOperationalsName(internalTxn),
                sumDebit: internalTxn.amount,
                sumCredit: 0,
              })
            }
          }
        } else {
          const targetProductIdx = productsSummary.products.findIndex((product : ProductAggregateData) => product.id === internalTxn.category_id)

          if (internalTxn.transaction_type === TRANSACTION_TYPES.CREDIT) {
            productsSummary.sumCredit += internalTxn.amount;
            if (targetProductIdx >= 0) {
              productsSummary.products[targetProductIdx].sumCredit += internalTxn.amount;
              productsSummary.products[targetProductIdx].sumQtyIn += internalTxn.qty ?? 0;
            } else {
              productsSummary.products.push({
                id : internalTxn.category_id,
                name: getProductsName(internalTxn),
                sumCredit: internalTxn.amount,
                sumQtyIn: internalTxn.qty ?? 0,
                sumDebit: 0,
                sumQtyOut: 0,
              })
            }
          } else {
            productsSummary.sumDebit += internalTxn.amount;
            if (targetProductIdx >= 0) {
              productsSummary.products[targetProductIdx].sumDebit += internalTxn.amount;
              productsSummary.products[targetProductIdx].sumQtyOut += internalTxn.qty ?? 0;
            } else {
              productsSummary.products.push({
                id : internalTxn.category_id,
                name: getProductsName(internalTxn),
                sumDebit: internalTxn.amount,
                sumQtyIn: 0,
                sumCredit: 0,
                sumQtyOut: internalTxn.qty ?? 0,
              })
            }
          }
        }
      })
    })

    return {
      productsSummary,
      opsSummary,
    }
  }, [data, getOperationalsName, getProductsName])

  const showProductDebitDetails = useCallback(() => {
    setIsProductSummaryVisible(true);
    setIsOpsSummaryVisible(false);
    setSelectedSummaryType(TRANSACTION_TYPES.DEBIT)
  }, [])

  const showProductCreditDetails = useCallback(() => {
    setIsProductSummaryVisible(true);
    setIsOpsSummaryVisible(false);
    setSelectedSummaryType(TRANSACTION_TYPES.CREDIT)
  }, [])

  const showOpsDebitDetails = useCallback(() => {
    setIsProductSummaryVisible(false);
    setIsOpsSummaryVisible(true);
    setSelectedSummaryType(TRANSACTION_TYPES.DEBIT)
  }, [])

  const showOpsCreditDetails = useCallback(() => {
    setIsProductSummaryVisible(false);
    setIsOpsSummaryVisible(true);
    setSelectedSummaryType(TRANSACTION_TYPES.CREDIT)
  }, [])

  const handleDrawerClosed = useCallback(() => {
    setIsProductSummaryVisible(false);
    setIsOpsSummaryVisible(false);
  }, [])
  
  return (
    <div>
    <ProductSummaryBreakdown 
      visible={isProductSummaryVisible}
      summaryType={selectedSummaryType}
      closeDrawer={handleDrawerClosed}
      data={summaryData.productsSummary}
      transactionsData={data}
    />
    <Row gutter={[8, 8]} className="summary-container">
      <Col xs={12}>
          <Statistic 
            className="general-statistic"
            title="Total Pemasukan"
            value={(summaryData.productsSummary.sumDebit + summaryData.opsSummary.sumDebit) || "-"}
            prefix="Rp. "
            valueStyle={{ color: '#3f8600', fontSize: "1.2em" }}
          />
      </Col>
      <Col xs={12}>
          <Statistic 
            className="general-statistic"

            title="Total Pengeluaran"
            value={(summaryData.productsSummary.sumCredit + summaryData.opsSummary.sumCredit) || "-"} 
            prefix="Rp. "
            valueStyle={{ color: '#cf1322', fontSize: "1.2em" }}
          />
      </Col>
      <Col xs={12}>
        <Card className="compact-card" onClick={showProductDebitDetails}>
          <Statistic 
            title="Total Pemasukan (Produk)"
            value={summaryData.productsSummary.sumDebit || "-"}
            prefix="Rp. "
            valueStyle={{ color: '#3f8600', fontSize: "1.2em" }}
          />
        </Card>
      </Col>
      <Col xs={12}>
        <Card className="compact-card" onClick={showProductCreditDetails}>
          <Statistic 
            title="Total Pengeluaran (Produk)"
            value={summaryData.productsSummary.sumCredit || "-"}
            prefix="Rp. "
            valueStyle={{ color: '#cf1322', fontSize: "1.2em" }}
          />
        </Card>
      </Col>
      <Col xs={12}>
        <Card className="compact-card" onClick={showOpsDebitDetails}>
          <Statistic 
            title="Total Pemasukan (Operasional)"
            value={summaryData.opsSummary.sumDebit || "-"}
            prefix="Rp. "
            valueStyle={{ color: '#3f8600', fontSize: "1.2em" }}
          />
        </Card>
      </Col>
      <Col xs={12}>
        <Card className="compact-card" onClick={showOpsCreditDetails}>
          <Statistic 
            title="Total Pengeluaran (Operasional)"
            value={summaryData.opsSummary.sumCredit || "-"}
            prefix="Rp. "
            valueStyle={{ color: '#cf1322', fontSize: "1.2em" }}
          />
        </Card>
      </Col>
    </Row>

    </div>
  )
}