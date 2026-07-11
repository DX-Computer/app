"use client";

import { FunctionComponent, JSX, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "./Shell";
import MarketLeft from "./MarketLeft";
import MarketCenter from "./MarketCenter";
import useMarketBrowse from "../hooks/useMarketBrowse";
import { MarketScreenProps, ProductFilters } from "../types/common.types";

const priceBucket = (price: number): string => {
  if (price < 25) return "<25";
  if (price <= 100) return "25–100";
  return "100+";
};

const MarketScreen: FunctionComponent<MarketScreenProps> = ({
  dict,
}): JSX.Element => {
  const { products } = useMarketBrowse();
  const params = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({
    text: "",
    kit: "",
    price: "all",
    stock: "all",
    grant: "all",
  });

  useEffect(() => {
    const kit = params.get("kit");
    if (kit) {
      setFilters((f) => (f.kit === kit ? f : { ...f, kit }));
    }
  }, [params]);

  const filtered = products.filter((p) => {
    const t = filters.text.trim().toLowerCase();
    const textOk = t === "" || p.title.toLowerCase().includes(t);
    const kitOk = filters.kit.trim() === "" || p.kitId === filters.kit.trim();
    const priceOk =
      filters.price === "all" || priceBucket(p.price) === filters.price;
    const inStock = p.quantity > 0;
    const stockOk =
      filters.stock === "all" ||
      (filters.stock === "in stock" ? inStock : !inStock);
    const grantOk =
      filters.grant === "all" ||
      (filters.grant === "linked" ? p.grantLinked : !p.grantLinked);
    return textOk && kitOk && priceOk && stockOk && grantOk;
  });

  return (
    <Shell
      dict={dict}
      left={
        <MarketLeft
          filters={filters}
          setFilters={setFilters}
          count={filtered.length}
          total={products.length}
        />
      }
    >
      <MarketCenter products={filtered} />
    </Shell>
  );
};

export default MarketScreen;
