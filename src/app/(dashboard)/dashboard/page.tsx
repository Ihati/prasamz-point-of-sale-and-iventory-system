
'use client';

import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { useSales } from '@/hooks/use-sales';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Converts Firestore Timestamps or other date formats to a JS Date object.
function normalizeDate(date: any): Date {
  if (!date) return new Date(0); // Return epoch if date is null/undefined
  // Check if it's a Firestore Timestamp
  if (date && typeof date.seconds === 'number') {
    // Convert Firestore Timestamp to JavaScript Date
    return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
  }
  // Check if it's already a JavaScript Date object
  if (date instanceof Date) {
    return date;
  }
  // Try parsing from a string (like an ISO string)
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  // Fallback for any other unexpected format
  return new Date(0);
}


export default function Dashboard() {
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading } = useSales();

  const lowStockProducts = useMemo(() => products.filter((p) => p.quantity < 15), [products]);
  const stockCount = useMemo(() => products.reduce((sum, p) => sum + p.quantity, 0), [products]);
  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  const loading = productsLoading || salesLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Products
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockProducts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Items needing attention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Count</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all products
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                An overview of your most recent sales.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/sales">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => {
                    const totalAmount = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="font-medium">{sale.customerName}</div>
                        </TableCell>
                        <TableCell className="text-right">Shs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="hidden sm:table-cell text-right">{normalizeDate(sale.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              These products are running low.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            {loading ? <Skeleton className='h-24' /> : lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.category}
                  </p>
                </div>
                <div className="ml-auto font-medium text-destructive">{product.quantity} left</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No products are currently low on stock.</p>}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
