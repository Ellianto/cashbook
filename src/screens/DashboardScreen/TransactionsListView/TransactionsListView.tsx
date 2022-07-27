import React, { useCallback, useRef } from 'react';
import moment from "moment";
import numeral from "numeral";

import {
  List,
  Table,
  Empty,
  Button,
} from 'antd';
import { ColumnType } from "antd/lib/table";

import { TransactionsData, TransactionItem } from "../../../constants/interfaces";
import { constants } from "../../../constants";

import "./TransactionsList.css"
import { useReactToPrint } from 'react-to-print';

const domToPdf = require( "dom-to-pdf")

const { CATEGORY_TYPES, TRANSACTION_TYPES } = constants;
interface TransactionsListViewProps {
  data: TransactionsData[]
  getProductsName?: (item : TransactionItem) => string
  getOperationalsName?: (item : TransactionItem) => string
}

export const TransactionsListView : React.FC<TransactionsListViewProps> = (props) => {
  const { data = [], getProductsName = () => '', getOperationalsName = () => '' } = props
  const ref = useRef(null);

  const generateTableColumns = useCallback((tx : TransactionsData) => {
    return [
      {
        title: moment(tx.date).format('LL'),
        align: "left",
        dataIndex: "transaction_id",
        className: "column-data",
        width: '36%',
        render: (_ : string, record : TransactionItem) => {
          if (record.category_type === CATEGORY_TYPES.PRODUCT) {
            return `${getProductsName(record)} (${record.qty?.toFixed(2) ?? 0} kg)`
          } else {
            return getOperationalsName(record); 
          }
        },
      },
      {
        title: tx.total_debit === 0 ? "-" : `Rp. ${numeral(tx.total_debit).format("0,0")}`,
        align: "right",
        dataIndex: "amount",
        key: "debit_amount",
        width: "32%",
        className: "debit column-data",
        render: (_ : string, record: TransactionItem) => {
          if (record.transaction_type === TRANSACTION_TYPES.DEBIT) {
            return "Rp. " + numeral(record.amount).format("0,0")
          }

          return "-"
        }
      },
      {
        title: tx.total_credit === 0 ? "-" : `Rp. ${numeral(tx.total_credit).format("0,0")}`,
        align: "right",
        dataIndex: "amount",
        key: "credit_amount",
        width: "32%",
        className: "credit column-data",
        render: (_ : string, record: TransactionItem) => {
          if (record.transaction_type === TRANSACTION_TYPES.CREDIT) {
            return "Rp. " + numeral(record.amount).format("0,0")
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
    print: async (printIframe : HTMLIFrameElement) => {
      const document = printIframe.contentDocument;
      if (document) {
        const html = document.getElementsByTagName("html")[0];
        html.getElementsByTagName("body")[0].style.padding = "48px"
        console.log(html);
        domToPdf(html, { filename : `rekap_${moment().format("YYYYMMDD_HHmmss")}.pdf`, overrideWidth: 720}, () => {
          console.log("PDF Downloaded!")
        })
      }
    },
  });

  return (
    <div>
      <div ref={ref}>

    <List 
      size="large"
      locale={{ emptyText : <Empty description="Tidak ada transaksi pada kurun waktu tersebut!" />}}
      dataSource={data}
      rowKey="date"
      split={true}
      renderItem={(item : TransactionsData) => (
        <Table 
          columns={generateTableColumns(item)}
          dataSource={item.transactions}
          rowKey={(data : TransactionItem) => data.transaction_id}
          size="middle"
          className="tx-table"
          sticky={true}
          pagination={false}
        />
      )}
    />
      </div>

    <Button block type="primary" onClick={handlePrintTransactionList}>
      Print
    </Button>
    </div>
  )
}