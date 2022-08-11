import React, { useCallback } from 'react';

import { Drawer, List, Progress, Button } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons';

import { 
  TransactionTypeValues,
  OperationalAggregateData,
  OperationalSummaryData,
} from "../../../../constants/interfaces";
import { constants } from '../../../../constants';
import { numberFormatting } from '../../../../utils';

import "./OpsSummaryBreakdown.css"

const { TRANSACTION_TYPES } = constants
interface OpsSummaryBreakdownProps {
  visible: boolean
  data: OperationalSummaryData
  closeDrawer: () => void
  summaryType: TransactionTypeValues
}

export const OpsSummaryBreakdown : React.FC<OpsSummaryBreakdownProps> = (props) => {
  const { visible, data, closeDrawer, summaryType } = props

  const renderOperationalItemSummary = useCallback((item : OperationalAggregateData) => {
    const percentage = numberFormatting.roundTo2Decimals((summaryType === TRANSACTION_TYPES.CREDIT ? (item.sumCredit / data.sumCredit) : (item.sumDebit / data.sumDebit)) * 100)

    return (
      <List.Item
        extra={[
          <Button type="link" key={`details_${item.id}`} icon={<InfoCircleOutlined />} />
        ]}
      >
        <List.Item.Meta 
          className="percentage-container"
          title={item.name}
          description={<Progress size="small" status="normal" percent={percentage} />}
        />
      </List.Item>
    )
  }, [data, summaryType])

  return (
    <Drawer
      height={480}
      closable={true}
      visible={visible}
      placement="bottom"
      onClose={closeDrawer}
      bodyStyle={{ padding : 16 }}
      title={`Ringkasan ${summaryType === TRANSACTION_TYPES.CREDIT ? "Pengeluaran" : "Pemasukan"} Operasional`}
    >
      <List 
        rowKey="id"
        itemLayout="vertical"
        renderItem={renderOperationalItemSummary}
        dataSource={data.operationals.sort((a, b) => {
          if (summaryType === TRANSACTION_TYPES.CREDIT) {
            return b.sumCredit - a.sumCredit
          } else {
            return b.sumDebit - a.sumDebit
          }
        })}
      />
    </Drawer>
  )
}