import React, { useState, useCallback, useEffect } from 'react';

import { Drawer, InputNumber } from 'antd';
import Calculator from 'awesome-react-calculator'

import { numberFormatting } from '../../utils';

import './CalculatorInput.css'

interface CalculatorResult {
  expression: string;
  result: string;
}

interface CalculatorInputProps {
  initialValue: number;
  onChange: (value: number) => void;
  inputNumberProps: Record<string,any>
}

export const CalculatorInput : React.FC<CalculatorInputProps> = (props) => {
  const { initialValue, onChange, inputNumberProps = {} } = props;
  const [result, setResult] = useState(0)
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

  const handleEvaluateResult = useCallback((newResult : CalculatorResult) => {
    const parsedResult = numberFormatting.roundTo2Decimals(parseFloat(newResult.result));
    setResult(parsedResult)
    onChange(parsedResult);
    setDrawerVisible(false);
  }, [onChange]);

  const handleOpenCalculatorView = useCallback(() => setDrawerVisible(true), []);

  useEffect(() => {
    if (initialValue) {
      setResult(initialValue);
    }
  }, [initialValue])

  return (
    <div className="calculator-input">
      <InputNumber 
        className="block-input"
        {...inputNumberProps}
        value={result}
        readOnly={true}
        onClick={handleOpenCalculatorView}
      />
      <Drawer
        destroyOnClose={true}
        height={480}
        visible={drawerVisible}
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
      >
        <Calculator onResultChange={handleEvaluateResult} />
      </Drawer>
    </div>
  )
};