import React, {useCallback} from 'react'

import { Row, Col, Typography, Button } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons';

import { ScreenTemplate} from '../../components'

import { firebaseAuth } from '../../firebase'

import "./HomeScreen.css"

const { Title, Text, Paragraph } = Typography;

export const HomeScreen = () => {
  const logOut = useCallback(async () => {
    await firebaseAuth.signOut()
  }, [])

  return (
    <ScreenTemplate title="Home">
      <Row gutter={[8, 12]} className="home-container">
        <Col xs={24} className="text-center">
          <Title level={5}>
            {process.env.REACT_APP_NAME} v{process.env.REACT_APP_VERSION}
          </Title>
        </Col>
        <Col xs={24}>
          <Paragraph>
            Web App ini dapat di-instal di handphone-mu!
          </Paragraph>
        </Col>
        <Col xs={24}>
          <Paragraph>
            <ul>
              <li>Buka website ini di handphone-mu menggunakan Google Chrome</li>
              <li>Tekan tombol menu titik-titik (<EllipsisOutlined rotate={90} />) di Google Chrome di handphone-mu</li>
              <li>Pilih <Text strong>Add To Home Screen</Text></li>
            </ul>
          </Paragraph>
        </Col>
        <Col xs={24}>
          <Button block type="primary" danger onClick={logOut}>
            Log out
          </Button>
        </Col>
      </Row>
    </ScreenTemplate>
  )
}