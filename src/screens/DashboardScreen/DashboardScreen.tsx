import React, { useState, useCallback, useEffect} from "react";
import moment from "moment";
import {
  Row, 
  Col,
  List,
  Table,
  Spin,
  Radio,
  Space,
  Button,
  Typography,
  Segmented,
  DatePicker,
  RadioChangeEvent,
} from 'antd';

import { BackButton, ScreenTemplate } from '../../components'

import "./DashboardScreen.css"

const {Text} = Typography;

const DASHBOARD_VIEWS = {
  LIST: "LIST",
  SUMMARY: "SUMMARY",
}

const DATE_INTERVALS = {
  TODAY: "TODAY",
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  THIS_QUARTER: "THIS_QUARTER",
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
    label: "Hari ini",
    value: DATE_INTERVALS.TODAY,
  },
  { 
    label: "Bulan ini",
    value: DATE_INTERVALS.THIS_MONTH,
  },
  { 
    label: "Bulan lalu",
    value: DATE_INTERVALS.LAST_MONTH,
  },
  { 
    label: "Kuartal lalu",
    value: DATE_INTERVALS.THIS_QUARTER,
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

  const handleDateIntervalChanged = useCallback((e : RadioChangeEvent) => {
    setDateInterval(e.target.value)
  }, []);

  const handleStartDateChanged = useCallback((date : moment.Moment | null, _ : string) => {
    setStartDate(date)
    setEndDate(null)
  }, []);

  const handleEndDateChanged = useCallback((date : moment.Moment | null, _ : string) => {
    setStartDate(date)
  }, [])

  const handleDisabledEndDate = useCallback((currDate : moment.Moment) => currDate.isAfter(moment()), [])

  const handleCustomDateRangeClicked = useCallback(() => {
    console.log("Start Date : ", startDate?.format())
    console.log("End Date : ", endDate?.format())
  }, [startDate, endDate]);

  return (
    <ScreenTemplate title="Dashboard" leftButton={<BackButton />}>
      <Spin spinning={isLoading}>
        <Segmented
          options={dashboardViewOptions}
          onChange={(value) => setDashboardView(`${value}`)}
          value={dashboardView}
          block
          size="large"
        />

        <div className="screen-container">
          <Space direction="vertical">
            <Text>Pilih interval</Text>
            <Radio.Group 
              optionType="button"
              className="date-interval-buttons"
              value={dateInterval}
              options={dateIntervalOptions} 
              onChange={handleDateIntervalChanged}
            />
            {dateInterval === DATE_INTERVALS.CUSTOM ? (
              <Row align="middle" justify="space-around">
                <Col xs={10}>
                  <DatePicker 
                    mode="date"
                    size="large"
                    placeholder="Tanggal awal"
                    value={startDate}
                    onChange={handleStartDateChanged}
                  />
                </Col>
                <Col xs={10}>
                  <DatePicker 
                    mode="date"
                    size="large"
                    placeholder="Tanggal akhir"
                    value={endDate}
                    onChange={handleEndDateChanged}
                    disabled={!startDate}
                    disabledDate={handleDisabledEndDate}
                  />
                </Col>
                <Col xs={4}>
                  <Button block size="large" type="primary" onClick={handleCustomDateRangeClicked}>
                    Tampilkan
                  </Button>
                </Col>
              </Row>
            ) : null}
          </Space>

        {dashboardView === DASHBOARD_VIEWS.LIST ? (
          <div> List View Here</div>
        ) : (
          <div> Dashboard View Here</div>
        )}
        </div>
      </Spin>
    </ScreenTemplate>
  );
};
