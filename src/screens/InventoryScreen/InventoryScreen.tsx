import React, { useCallback, useEffect, useState } from "react";

import { List, Card, Button } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";

import { BackButton, ScreenTemplate } from "../../components";
import { ProductInventory } from "../../constants/interfaces";
import { BottomSheetInventoryForm } from "./InventoryForm";

const dummyData: ProductInventory[] = [
  {
    id: "1",
    name: "Plastik",
    stock: 50.0,
  },
  {
    id: "2",
    name: "Besi",
    stock: 28.5,
  },
  {
    id: "1",
    name: "Kertas",
    stock: 12.56,
  },
];

interface EditProductButtonProps {
  product: ProductInventory;
  onClick: (item: ProductInventory) => void;
}

// TODO: Implement API logic
const EditProductButton: React.FC<EditProductButtonProps> = (props) => {
  const { product, onClick } = props;

  return (
    <Button
      className="edit-product-button"
      type="text"
      icon={<EditOutlined />}
      onClick={() => onClick(product)}
    />
  );
};

// TODO: Implement pagination if needed
export const InventoryScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductInventory[]>([]);

  const [bottomDrawerVisible, setBottomDrawerVisible] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<ProductInventory | null>(
    null
  );

  useEffect(() => {
    setTimeout(() => {
      setProducts(dummyData)
      setIsLoading(false);
    }, 1200);
  }, []);

  const handleEditProductClicked = useCallback((product: ProductInventory) => {
    setProductToEdit(product);
    setBottomDrawerVisible(true);
  }, []);

  const handleAddProductClicked = useCallback(() => {
    setProductToEdit(null);
    setBottomDrawerVisible(true);
  }, []);

  const handleBottomDrawerClosed = useCallback(() => {
    setProductToEdit(null);
    setBottomDrawerVisible(false);
  }, []);

  return (
    <ScreenTemplate
      title="Inventory"
      leftButton={<BackButton />}
      rightButton={
        <Button
          className="add-product-button"
          type="text"
          size="large"
          icon={<PlusCircleOutlined />}
          onClick={handleAddProductClicked}
        />
      }
    >
      {products.length > 0 ? (
        <List
          size="small"
          rowKey="id"
          itemLayout="vertical"
          loading={isLoading}
          dataSource={products}
          renderItem={(item: ProductInventory) => (
            <List.Item>
              <Card
                title={item.name}
                actions={[
                  <EditProductButton
                    product={item}
                    onClick={handleEditProductClicked}
                    key={`edit-${item.id}`}
                  />,
                ]}
              >
                <p className="product-stock">Stock : {item.stock ?? 0}</p>
                {/* <p className="product-avg">AVG Price : {(item.total_cost ?? 0) / (item.stock || 1)}</p> */}
              </Card>
            </List.Item>
          )}
        />
      ) : null}
      <BottomSheetInventoryForm 
        visible={bottomDrawerVisible}
        productToEdit={productToEdit}
        handleBottomSheetClosed={handleBottomDrawerClosed}
      />
    </ScreenTemplate>
  );
};
