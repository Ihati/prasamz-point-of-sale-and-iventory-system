
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Product, PriceType } from '@/lib/placeholder-data';

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product, priceType: PriceType) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
         <h3 className="font-semibold text-sm truncate">{product.name}</h3>
      </CardHeader>
      <CardContent className="flex-grow grid gap-1">
        <p className="text-xs text-muted-foreground">
            Retail: Shs {product.retailPrice.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
            Wholesale: Shs {product.wholesalePrice.toFixed(2)}
        </p>
      </CardContent>
      <div className="p-2 flex flex-col gap-2">
        <Button
          className="w-full"
          size="sm"
          variant="outline"
          onClick={() => onAddToCart(product, 'retail')}
        >
          Add Retail
        </Button>
        <Button
          className="w-full"
          size="sm"
          onClick={() => onAddToCart(product, 'wholesale')}
        >
          Add Wholesale
        </Button>
      </div>
    </Card>
  );
}
