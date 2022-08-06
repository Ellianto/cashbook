import React, { useCallback, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

import {
  Row, Col,
  List,
  Table,
  Empty,
  Button,
  Modal,
  Typography,
  message,
} from 'antd';
import { ColumnType } from "antd/lib/table";

import { TransactionsData, TransactionItem } from "../../../constants/interfaces";
import { constants } from "../../../constants";

import "./TransactionsList.css"
import { dateFormatting, numberFormatting } from '../../../utils';
import { TransactionDetails } from './TransactionDetails';
import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { bulkDeleteTransactionMethod } from '../../../firebase';

const { CATEGORY_TYPES, TRANSACTION_TYPES } = constants;
const { Paragraph } = Typography;
interface TransactionsListViewProps {
  data: TransactionsData[]
  startDate: string
  endDate: string
  triggerRefetch: () => void
  getProductsName?: (item: TransactionItem) => string
  getOperationalsName?: (item: TransactionItem) => string
}

export const TransactionsListView: React.FC<TransactionsListViewProps> = (props) => {
  const { startDate = "", endDate = "", data = [], getProductsName = () => '', getOperationalsName = () => '', triggerRefetch } = props
  const ref = useRef(null);

  const [selectedTransactionDate, setSelectedTransactionDate] = useState<string | null>(null)
  const [selectedTransactionItem, setSelectedTransactionItem] = useState<TransactionItem | null>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState<boolean>(false)

  const generateTableColumns = useCallback((tx: TransactionsData) => {
    return [
      {
        title: dateFormatting.formatForHumanDisplay(tx.date),
        align: "left",
        dataIndex: "transaction_id",
        className: "column-data",
        width: '36%',
        render: (_: string, record: TransactionItem) => {
          if (record.category_type === CATEGORY_TYPES.PRODUCT) {
            return `${getProductsName(record)} (${record.qty?.toFixed(2) ?? 0} kg)`
          } else {
            return getOperationalsName(record);
          }
        },
      },
      {
        title: tx.total_debit === 0 ? "-" : `Rp. ${numberFormatting.formatIDRCurrencyNumber(tx.total_debit)}`,
        align: "right",
        dataIndex: "amount",
        key: "debit_amount",
        width: "32%",
        className: "debit column-data",
        render: (_: string, record: TransactionItem) => {
          if (record.transaction_type === TRANSACTION_TYPES.DEBIT) {
            return "Rp. " + numberFormatting.formatIDRCurrencyNumber(record.amount)
          }

          return "-"
        }
      },
      {
        title: tx.total_credit === 0 ? "-" : `Rp. ${numberFormatting.formatIDRCurrencyNumber(tx.total_credit)}`,
        align: "right",
        dataIndex: "amount",
        key: "credit_amount",
        width: "32%",
        className: "credit column-data",
        render: (_: string, record: TransactionItem) => {
          if (record.transaction_type === TRANSACTION_TYPES.CREDIT) {
            return "Rp. " + numberFormatting.formatIDRCurrencyNumber(record.amount)
          }

          return "-"
        }
      },
    ] as ColumnType<TransactionItem>[]
  }, [getProductsName, getOperationalsName])

  const handlePrintTransactionList = useReactToPrint({
    onPrintError: console.error,
    content: () => ref.current,
    removeAfterPrint: true,
    documentTitle: `Cashbook_Rekap_${startDate ?? ""}-${endDate ?? ""}`,
    // FAQs : https://github.com/gregnb/react-to-print#helpful-style-tips
  });

  const handleRowClicked = useCallback((record: TransactionItem, txDate: string) => {
    setSelectedTransactionDate(txDate)
    setSelectedTransactionItem(record)
    setShowTransactionDetails(true)
  }, [])

  const hideTransactionDetails = useCallback((shouldRefetch = false) => {
    setSelectedTransactionDate(null)
    setSelectedTransactionItem(null)
    setShowTransactionDetails(false)

    if (shouldRefetch) {
      setTimeout(() => {
        triggerRefetch()
      }, 800)
    }
  }, [triggerRefetch])

  const bulkRemoveTransactions = useCallback(() => {
    if (!startDate) {
      message.warning("Pastikan tanggal mulai sudah terpilih!")
      return
    }

    if (!endDate) {
      message.warning("Pastikan tanggal selesai sudah terpilih!")
      return
    }

    Modal.confirm({
      title: "Yakin ingin merekap dan menghapus transaksi?",
      centered: true,
      closable: true,
      maskClosable: true,
      icon: <ExclamationCircleTwoTone twoToneColor="#eb2f96" />,
      okText: "Ya, hapus",
      okButtonProps: {
        ghost: false,
        danger: true,
      },
      content: (
        <Paragraph>
          Melakukan rekap akan menghapus semua transaksi pada jangka waktu yang telah ditentukan. 
          Data yang hilang tidak bisa dikembalikan lagi!
        </Paragraph>
      ),
      onOk: async () => {
        await bulkDeleteTransactionMethod({
          start_date: startDate,
          end_date: endDate,
        })

        await triggerRefetch()
      }
    })
  }, [startDate, endDate, triggerRefetch])

  return (
    <div>
      <div ref={ref}>

        <List
          size="large"
          locale={{ emptyText: <Empty description="Tidak ada transaksi pada kurun waktu tersebut!" /> }}
          dataSource={data}
          rowKey="date"
          split={true}
          renderItem={(item: TransactionsData) => (
            <Table
              columns={generateTableColumns(item)}
              dataSource={item.transactions}
              rowKey={(data: TransactionItem) => data.transaction_id}
              size="middle"
              className="tx-table"
              sticky={true}
              pagination={false}
              onRow={(record, idx) => ({
                onClick: (_) => handleRowClicked(record, item.date)
              })}
            />
          )}
        />
      </div>

      {data.length > 0 && (
        <Row gutter={[8, 12]}>
          <Col xs={24}>
            <Button block type="primary" onClick={handlePrintTransactionList}>
              Simpan PDF
            </Button>
          </Col>
          <Col xs={24}>
            <Button block danger type="primary" onClick={bulkRemoveTransactions}>
              Rekap dan hapus
            </Button>
          </Col>
        </Row>
      )}
      {selectedTransactionDate && selectedTransactionItem && (
        <TransactionDetails
          visible={showTransactionDetails}
          txDetails={selectedTransactionItem}
          txDate={selectedTransactionDate}
          closeDrawer={hideTransactionDetails}
          getProductsName={getProductsName}
          getOperationalsName={getOperationalsName}
        />
      )}
    </div>
  )
}