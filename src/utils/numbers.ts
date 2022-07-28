import numeral from "numeral"

export const roundTo2Decimals = (value : number) => Math.round(value * 100) / 100

export const formatIDRCurrencyNumber = (value : number) => numeral(value).format("0,0")