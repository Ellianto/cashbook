import React from 'react'

import { useNavigate } from 'react-router-dom'

import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

export const BackButton = () => {
  const navigate = useNavigate();
  return (
    <Button type="text" onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />} />
  )
};