
'use client';

import { ProductCard } from '@/components/pos/product-card';
import { Cart } from '@/components/pos/cart';
import { Product, PriceType } from '@/lib/placeholder-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/use-products';
import { useMemo } from 'react';

export default function POSPage() {
  const { products, searchTerm } = useProducts();
  const handleAddToCart = (product: Product, priceType: PriceType) => {
    window.dispatchEvent(
      new CustomEvent('addToCart', { detail: { product, priceType } })
    );
  };
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <ScrollArea className="h-[calc(100vh-120px)]">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
             <div className="flex h-[calc(100vh-200px)] items-center justify-center">
              <p className="text-muted-foreground">No products found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="lg:col-span-1">
        <Cart />
      </div>
    </div>
  );
}
