import React, { useMemo, useCallback } from 'react';

import { Row, Col, Drawer, Card, Statistic, List, Typography, Space } from 'antd'

import { constants } from '../../../../constants';
import { ProductAggregateData, TransactionItem, TransactionsData, TransactionTypeValues } from '../../../../constants/interfaces';

import "./ProductDetailsBreakdown.css"
import { dateFormatting, numberFormatting } from '../../../../utils';

const { TRANSACTION_TYPES, CATEGORY_TYPES } = constants
const { Text } = Typography

interface ProductDetailsBreakdownProps {
  visible: boolean
  closeDrawer: () => void
  transactionType: TransactionTypeValues
  data: TransactionsData[]
  summary: ProductAggregateData
}

interface ProductDetailsBreakdownData {
  id: string
  date : string
  amount : number
  qty : number
}

export const ProductDetailsBreakdown : React.FC<ProductDetailsBreakdownProps> = (props) => {
  const { visible, data, closeDrawer, transactionType, summary } = props

  const breakdowns = useMemo(() => {
    const breakdownDetails : ProductDetailsBreakdownData[] = []

    data.forEach((txData) => {
      txData.transactions.forEach((internalTx : TransactionItem) => {
        if (summary.id === internalTx.category_id && internalTx.category_type === CATEGORY_TYPES.PRODUCT && transactionType === internalTx.transaction_type) {
          breakdownDetails.push({
            id : internalTx.transaction_id,
            date : txData.date,
            amount: internalTx.amount,
            qty: internalTx.qty ?? 0,
          })
        }
      })
    })

    return breakdownDetails
  }, [data, summary, transactionType])

  const renderProductBreakdowns = useCallback((item : ProductDetailsBreakdownData) => (
    <List.Item>
      <Row align="middle">
        <Col xs={12}>
          <Space direction="vertical">
          <Text>{summary.name} ({item.qty} kg)</Text>
          <Text type="secondary">
            {dateFormatting.formatForHumanDisplay(item.date)}
          </Text>
          </Space>
        </Col>
        <Col xs={12} style={{ textAlign: "right" }}>
          <Text className={transactionType === TRANSACTION_TYPES.CREDIT ? "red" : "green"}>
            Rp. {numberFormatting.formatIDRCurrencyNumber(item.amount)}
          </Text>
        </Col>
      </Row>
    </List.Item>
  ), [transactionType, summary])

  return (
    <Drawer
    height={480}
    closable={true}
    visible={visible}
    placement="bottom"
    onClose={closeDrawer}
    bodyStyle={{ padding : 16 }}
    title={`Rincian ${transactionType === TRANSACTION_TYPES.CREDIT ? "Pengeluaran" : "Pemasukan"} ${summary.name}`}
  >
    <Row>
      <Col xs={12}>
        <Card className="compact-card">
          <Statistic 
            title="Qty Masuk"
            value={summary.sumQtyIn}
            suffix="kg"
          />
        </Card>
      </Col>
      <Col xs={12}>
        <Card className="compact-card">
          <Statistic 
            title="Qty Keluar"
            value={summary.sumQtyOut}
            suffix="kg"
          />
        </Card>
      </Col>
      <Col xs={24}>

      <List 
        rowKey="id"
        itemLayout="vertical"
        renderItem={renderProductBreakdowns}
        dataSource={breakdowns}
      />
      </Col>
    </Row>
    </Drawer>
  )
}