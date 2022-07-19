import React, { useCallback, useEffect, useState } from "react";

import { Form, Button, Input, Drawer, Spin, message } from "antd";

import { formRules } from "../../constants";
import { ProductInventory } from "../../constants/interfaces";

import { addProductMethod } from "../../firebase";

interface BottomSheetInventoryFormProps {
  visible: boolean;
  productToEdit: ProductInventory | null;
  handleBottomSheetClosed: () => void;
}

interface ProductFormValues {
  name: string;
}

const { required } = formRules;

export const BottomSheetInventoryForm: React.FC<
  BottomSheetInventoryFormProps
> = (props) => {
  const { visible, productToEdit, handleBottomSheetClosed } = props;

  const [formInstance] = Form.useForm();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && productToEdit) {
      formInstance.setFieldsValue({
        name: productToEdit.name ?? "",
      });
    } else {
      formInstance.resetFields();
    }
  }, [visible, productToEdit, formInstance]);

  const handleFormSubmit = useCallback(
    async (values: ProductFormValues) => {
      setIsLoading(true);
      console.log(values);

      try {
        const response = await addProductMethod(values);
        console.log("Callable Functions Response : ", response);
        message.success(
          `Barang berhasil di${productToEdit ? "ubah" : "tambahkan"}!`
        );

        handleBottomSheetClosed();
      } catch (error) {
        console.error(error);
        message.error("Error! Silahkan coba lagi dalam beberapa saat!");
      }

      setIsLoading(false);
    },
    [productToEdit, handleBottomSheetClosed]
  );

  return (
    <Drawer
      height={480}
      visible={visible}
      placement="bottom"
      title={`${productToEdit ? "Ubah" : "Tambah"} Barang`}
      onClose={handleBottomSheetClosed}
    >
      <Spin spinning={isLoading}>
        <Form
          name="product-form"
          layout="vertical"
          form={formInstance}
          scrollToFirstError={true}
          onFinish={handleFormSubmit}
        >
          <Form.Item
            id="name"
            name="name"
            label="Nama Barang"
            rules={required("Nama barang tidak boleh kosong!")}
          >
            <Input placeholder="Masukkan nama barang" maxLength={100} />
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
