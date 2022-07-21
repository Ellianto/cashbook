import React, { useCallback, useEffect, useState } from "react";

import { List, Card, Button, Segmented, Empty, Spin } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";

import { BackButton, ScreenTemplate } from "../../components";
import { BottomSheetCategoryForm } from "./BottomSheetCategoryForm";

import {
  ProductInventory,
  OperationalCategory,
} from "../../constants/interfaces";
import {
  GetProductsResponse,
  GetOperationalsResponse,
} from "../../constants/responses";
import { constants } from "../../constants";

import { getOperationalsMethod, getProductsMethod } from "../../firebase";
import { handleFirebaseError } from "../../utils";
import { CategoryTypeValues } from "../../constants/interfaces/CategoryTypes";

type Category = ProductInventory | OperationalCategory;

interface EditCategoryButtonProps {
  item: Category;
  onClick: (item: Category) => void;
}

const { CATEGORY_TYPES } = constants;

const categoryOptions = [
  {
    label: "Operasional",
    value: CATEGORY_TYPES.OPERATIONAL,
  },
  {
    label: "Produk",
    value: CATEGORY_TYPES.PRODUCT,
  },
];

const EditCategoryButton: React.FC<EditCategoryButtonProps> = (props) => {
  const { item, onClick } = props;

  return (
    <Button
      className="edit-category-button"
      type="text"
      icon={<EditOutlined />}
      onClick={() => onClick(item)}
    />
  );
};

// TODO: Implement pagination if needed
export const CategoryScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryView, setCategoryView] = useState<CategoryTypeValues>(
    CATEGORY_TYPES.PRODUCT
  );
  const [operationals, setOperationals] = useState<OperationalCategory[]>([]);
  const [products, setProducts] = useState<ProductInventory[]>([]);

  const [bottomDrawerVisible, setBottomDrawerVisible] =
    useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<
    ProductInventory | OperationalCategory | null
  >(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getProductsMethod();
      if (data) {
        const productsData = (data as GetProductsResponse).products;
        setProducts(productsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsLoading(false);
  }, []);

  const fetchOperationals = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getOperationalsMethod();
      if (data) {
        const operationalsData = (data as GetOperationalsResponse).operationals;
        setOperationals(operationalsData);
      }
    } catch (error) {
      handleFirebaseError(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (categoryView === CATEGORY_TYPES.OPERATIONAL) {
      fetchOperationals();
    } else {
      fetchProducts();
    }
  }, [categoryView, fetchProducts, fetchOperationals]);

  const handleEditCategoryClicked = useCallback((category: Category) => {
    setItemToEdit(category);
    setBottomDrawerVisible(true);
  }, []);

  const handleAddClicked = useCallback(() => {
    setItemToEdit(null);
    setBottomDrawerVisible(true);
  }, []);

  const handleBottomDrawerClosed = useCallback(
    (shouldRefresh = false) => {
      setItemToEdit(null);
      setBottomDrawerVisible(false);

      if (shouldRefresh) {
        if (categoryView === CATEGORY_TYPES.OPERATIONAL) {
          fetchOperationals();
        } else {
          fetchProducts();
        }
      }
    },
    [categoryView, fetchOperationals, fetchProducts]
  );

  return (
    <ScreenTemplate
      title="Kategori"
      leftButton={<BackButton />}
      rightButton={
        <Button
          className="add-button"
          type="text"
          size="large"
          icon={<PlusCircleOutlined />}
          onClick={handleAddClicked}
        />
      }
    >
      <Spin spinning={isLoading}>
        <Segmented
          options={categoryOptions}
          onChange={(value) => setCategoryView(`${value}`)}
          value={categoryView}
          block
          size="large"
        />
        {categoryView === CATEGORY_TYPES.PRODUCT ? (
          products.length > 0 ? (
            <List
              size="small"
              rowKey="id"
              itemLayout="vertical"
              dataSource={products}
              renderItem={(item: ProductInventory) => (
                <List.Item>
                  <Card
                    title={item.name}
                    actions={[
                      <EditCategoryButton
                        item={item}
                        onClick={handleEditCategoryClicked}
                        key={`edit-product-${item.id}`}
                      />,
                    ]}
                  >
                    <p className="product-stock">Stock : {item.stock ?? 0}</p>
                    <p className="product-avg">
                      AVG Price : {item.average_price ?? 0}
                    </p>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Tidak ada produk untuk ditampilkan">
              <Button
                className="add-cta"
                type="primary"
                size="large"
                icon={<PlusCircleOutlined />}
                onClick={handleAddClicked}
              >
                Tambahkan Produk
              </Button>
            </Empty>
          )
        ) : categoryView === CATEGORY_TYPES.OPERATIONAL ? (
          operationals.length > 0 ? (
            <List
              size="small"
              rowKey="id"
              itemLayout="vertical"
              dataSource={operationals}
              renderItem={(item: OperationalCategory) => (
                <List.Item>
                  <Card
                    title={item.name}
                    actions={[
                      <EditCategoryButton
                        item={item}
                        onClick={handleEditCategoryClicked}
                        key={`edit-operational-${item.id}`}
                      />,
                    ]}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Tidak ada kategori operasional untuk ditampilkan">
              <Button
                className="add-cta"
                type="primary"
                size="large"
                icon={<PlusCircleOutlined />}
                onClick={handleAddClicked}
              >
                Tambahkan Kategori Operasional
              </Button>
            </Empty>
          )
        ) : null}
      </Spin>

      <BottomSheetCategoryForm
        visible={bottomDrawerVisible}
        categoryView={categoryView}
        itemToEdit={itemToEdit}
        handleBottomSheetClosed={handleBottomDrawerClosed}
      />
    </ScreenTemplate>
  );
};
