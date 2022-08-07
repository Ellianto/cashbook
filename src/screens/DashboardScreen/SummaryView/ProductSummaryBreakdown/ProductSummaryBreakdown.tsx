import React, { useCallback, useState } from 'react';

import { Drawer, List, Progress, Button } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons';

import { 
  TransactionTypeValues,
  ProductAggregateData,
  ProductSummaryData,
  TransactionsData,
} from "../../../../constants/interfaces";
import { constants } from '../../../../constants';
import { numberFormatting } from '../../../../utils';

import { ProductDetailsBreakdown } from '../ProductDetailsBreakdown';

import "./ProductSummaryBreakdown.css"

const { TRANSACTION_TYPES } = constants
interface ProductSummaryBreakdownProps {
  visible: boolean
  data: ProductSummaryData
  closeDrawer: () => void
  summaryType: TransactionTypeValues
  transactionsData: TransactionsData[]
}

export const ProductSummaryBreakdown : React.FC<ProductSummaryBreakdownProps> = (props) => {
  const { visible, data, closeDrawer, summaryType, transactionsData } = props
  
  const [showProductBreakdown, setShowProductBreakdown] = useState<boolean>(false)
  const [productToBreakdown, setProductToBreakdown] = useState<ProductAggregateData | null>(null)

  const hideProductBreakdown = useCallback(() => {
    setShowProductBreakdown(false)
    setProductToBreakdown(null)
  }, [])

  const handleShowProductBreakdown = useCallback((productData : ProductAggregateData) => {
    setShowProductBreakdown(true)
    setProductToBreakdown(productData)
  }, [])

  const renderProductItemSummary = useCallback((item : ProductAggregateData) => {
    const percentage = numberFormatting.roundTo2Decimals((summaryType === TRANSACTION_TYPES.CREDIT ? (item.sumCredit / data.sumCredit) : (item.sumDebit / data.sumDebit)) * 100)

    return (
      <List.Item
        extra={[
          <Button type="link" key={`details_${item.id}`} icon={<InfoCircleOutlined />} onClick={() => handleShowProductBreakdown(item)} />
        ]}
      >
        <List.Item.Meta 
          className="percentage-container"
          title={item.name}
          description={<Progress size="small" status="normal" percent={percentage} />}
        />
      </List.Item>
    )
  }, [data, summaryType, handleShowProductBreakdown])

  return (
    <Drawer
      height={480}
      closable={true}
      visible={visible}
      placement="bottom"
      onClose={closeDrawer}
      bodyStyle={{ padding : 16 }}
      title={`Ringkasan ${summaryType === TRANSACTION_TYPES.CREDIT ? "Pengeluaran" : "Pemasukan"} Produk`}
    >
      <List 
        rowKey="id"
        itemLayout="vertical"
        renderItem={renderProductItemSummary}
        dataSource={data.products.sort((a, b) => {
          if (summaryType === TRANSACTION_TYPES.CREDIT) {
            return b.sumCredit - a.sumCredit
          } else {
            return b.sumDebit - a.sumDebit
          }
        })}
      />
      {productToBreakdown && (
        <ProductDetailsBreakdown 
        visible={showProductBreakdown}
        closeDrawer={hideProductBreakdown}
        transactionType={summaryType}
        data={transactionsData}
        summary={productToBreakdown}
      />
      )}
    </Drawer>
  )
}