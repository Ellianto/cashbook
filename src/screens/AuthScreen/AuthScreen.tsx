import React, { useState, useCallback } from 'react';

import { Form, Input, Button, Row, Col, Spin, Typography, message } from 'antd';

import { formRules } from '../../constants';

import { firebaseAuth } from '../../firebase'

import "./AuthScreen.css"
import { signInWithEmailAndPassword } from '@firebase/auth';
import { FirebaseError } from '@firebase/app';

const { required, email } = formRules;
const { Title } = Typography;

interface LoginFormValues {
  email: string
  password: string
}

export const AuthScreen: React.FC = () => {
  const [formInstance] = Form.useForm()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleFormFinish = useCallback(async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
      if (credential.user) {
        console.log(credential.user)
        message.success("Login berhasil!");
      }
    } catch (error) {
      const firebaseErr = error as FirebaseError;
      console.error(firebaseErr.code)
      console.error(firebaseErr.message)

      let errMsg = ''

      switch (firebaseErr.code) {
        case 'auth/network-request-failed':
          errMsg = "Terjadi kesalahan ketika login! Coba lagi dalam beberapa saat!"
          break;
      
        default:
          errMsg = "Username dan password yang anda masukkan salah!"
          break;
      }

      message.error(errMsg)
    }

    setIsLoading(false);
  }, [])

  return (
    <Row gutter={[8, 12]} className="page-container">
      <Col xs={24} className="title-container">
        <Title level={5}> Login </Title>
      </Col>
      <Col xs={24}>
        <Spin spinning={isLoading}>
          <Form
            name="login-form"
            layout="vertical"
            scrollToFirstError
            labelCol={{ xs: 24 }}
            wrapperCol={{ xs: 24 }}
            form={formInstance}
            onFinish={handleFormFinish}
          >
            <Form.Item
              id="email"
              name="email"
              label="Email"
              rules={email("Mohon isi email dengan benar!")}
            >
              <Input placeholder="Masukkan email" maxLength={40} type="email" />
            </Form.Item>
            <Form.Item
              id="password"
              name="password"
              label="Password"
              rules={required("Mohon isi password!")}
            >
              <Input.Password placeholder="Masukkan password" maxLength={40} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" block htmlType="submit">
                Login
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Col>

    </Row>
  )
}