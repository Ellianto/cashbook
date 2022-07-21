import React, { useCallback, useEffect, useState } from "react";

import { Form, Button, Input, Drawer, Spin, message } from "antd";

import { formRules, constants } from "../../constants";
import {
  OperationalCategory,
  ProductInventory,
} from "../../constants/interfaces";

import {
  addOperationalMethod,
  addProductMethod,
  editOperationalMethod,
  editProductMethod,
} from "../../firebase";
import { handleFirebaseError } from "../../utils";
import { CategoryTypeValues } from "../../constants/interfaces/CategoryTypes";

interface BottomSheetCategoryFormProps {
  visible: boolean;
  itemToEdit: ProductInventory | OperationalCategory | null;
  categoryView: CategoryTypeValues;
  handleBottomSheetClosed: (shouldRefresh?: boolean) => void;
}

interface CategoryFormValues {
  name: string;
}

const { required } = formRules;
const { CATEGORY_TYPES } = constants;

export const BottomSheetCategoryForm: React.FC<BottomSheetCategoryFormProps> = (
  props
) => {
  const { visible, itemToEdit, categoryView, handleBottomSheetClosed } = props;

  const [formInstance] = Form.useForm();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && itemToEdit) {
      formInstance.setFieldsValue({
        name: itemToEdit.name ?? "",
      });
    } else {
      formInstance.resetFields();
    }
  }, [visible, itemToEdit, formInstance]);

  const handleFormSubmit = useCallback(
    async (values: CategoryFormValues) => {
      setIsLoading(true);

      try {
        const { data } = itemToEdit
          ? categoryView === CATEGORY_TYPES.OPERATIONAL
            ? await editOperationalMethod({ id: itemToEdit.id, ...values })
            : await editProductMethod({ id: itemToEdit.id, ...values })
          : categoryView === CATEGORY_TYPES.OPERATIONAL
          ? await addOperationalMethod(values)
          : await addProductMethod(values);
        message.success(
          `Kategori berhasil di${itemToEdit ? "ubah" : "tambahkan"}!`
        );

        console.log(data)
        handleBottomSheetClosed(true);
      } catch (error) {
        handleFirebaseError(error);
      }

      setIsLoading(false);
    },
    [itemToEdit, categoryView, handleBottomSheetClosed]
  );

  return (
    <Drawer
      height={480}
      visible={visible}
      placement="bottom"
      title={`${itemToEdit ? "Ubah" : "Tambah"} Kategori`}
      onClose={() => handleBottomSheetClosed(false)}
    >
      <Spin spinning={isLoading}>
        <Form
          name="category-form"
          layout="vertical"
          form={formInstance}
          scrollToFirstError={true}
          onFinish={handleFormSubmit}
        >
          <Form.Item
            id="name"
            name="name"
            label="Nama"
            rules={required("Nama tidak boleh kosong!")}
          >
            <Input placeholder="Masukkan nama" maxLength={100} />
          </Form.Item>
          <Form.Item>
            <Button
              className="form-btn-primary"
              htmlType="submit"
              type="primary"
              size="large"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};
