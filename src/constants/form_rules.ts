import { Rule } from "antd/lib/form";

type NumberValue = number | undefined | null;

export const formRules = {
  required: (errorMessage = "This field is required"): Rule[] => [
    { required: true, message: errorMessage },
  ],
  email: (errorMessage = "The email you inputted is incorrect"): Rule[] => [
    { required: true, type: "email", message: errorMessage },
  ],
  array: (errorMessage = "Please select at least one option"): Rule[] => [
    { required: true, type: "array", min: 1, message: errorMessage },
  ],
  number: (
    message: string,
    min = 0,
    maxLimited = false,
    max = 10000
  ): Rule[] => {
    const errorMessage =
      message || `Please input valid amount (${min} - ${max})`;
    const invalidValue = (value: NumberValue) =>
      value === undefined ||
      value === null ||
      value < min ||
      (maxLimited && value > max);

    return [
      {
        required: true,
        message: errorMessage,
        validator: (_: any, value: NumberValue) =>
          invalidValue(value)
            ? Promise.reject(errorMessage)
            : Promise.resolve(),
      },
    ];
  },
};
