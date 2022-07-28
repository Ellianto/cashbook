import moment from "moment"

export const formatForHumanDisplay = (dateString : string) => moment(dateString).format("LL")
export const formatForStorage = (date : moment.Moment) => date.format("YYYYMMDD")
export const formatSimpleDisplay = (date : moment.Moment) => date.format("YYYY-MM-DD")