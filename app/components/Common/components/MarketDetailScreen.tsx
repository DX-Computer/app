"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import ProductDetailLeft from "./ProductDetailLeft";
import ProductDetailCenter from "./ProductDetailCenter";

const MarketDetailScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<ProductDetailLeft id={id} />}>
      <ProductDetailCenter id={id} />
    </Shell>
  );
};

export default MarketDetailScreen;
