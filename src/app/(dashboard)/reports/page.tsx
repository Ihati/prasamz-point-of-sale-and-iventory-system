
'use client';

import { useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useSales } from '@/hooks/use-sales';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Package, TrendingUp, PiggyBank, Calendar } from 'lucide-react';
import type { Product } from '@/lib/placeholder-data';
import { format } from 'date-fns';

type ProductReport = Product & {
  unitsSold: number;
  stockValue: number;
};

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


export default function ReportsPage() {
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading } = useSales();

  const loading = productsLoading || salesLoading;

  const { productReports, totalStockValue, totalSalesValue, totalProfit, monthlyReport } = useMemo(() => {
    if (loading) {
      return { productReports: [], totalStockValue: 0, totalSalesValue: 0, totalProfit: 0, monthlyReport: [] };
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    const monthlyData: { [key: string]: { salesValue: number; profit: number; monthLabel: string } } = {};
    let calculatedTotalProfit = 0;
    let totalSalesVal = 0;
    const salesByProductId = new Map<string, number>();

    sales.forEach(sale => {
      const saleDate = normalizeDate(sale.createdAt);
      const monthKey = format(saleDate, 'yyyy-MM');
      const monthLabel = format(saleDate, 'MMMM yyyy');

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { salesValue: 0, profit: 0, monthLabel };
      }

      sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        // Increment total sales value
        totalSalesVal += itemTotal;
        monthlyData[monthKey].salesValue += itemTotal;
        
        // Update units sold for product reports
        const currentUnits = salesByProductId.get(item.productId) || 0;
        salesByProductId.set(item.productId, currentUnits + item.quantity);

        // Calculate profit for this item and add to total and monthly profit
        const product = productMap.get(item.productId);
        const costPrice = product?.costPrice || 0;
        const itemProfit = (item.price - costPrice) * item.quantity;

        calculatedTotalProfit += itemProfit;
        monthlyData[monthKey].profit += itemProfit;
      });
    });

    const reports: ProductReport[] = products.map(product => {
      const unitsSold = salesByProductId.get(product.id) || 0;
      const stockValue = product.quantity * (product.costPrice || 0);
      return { ...product, unitsSold, stockValue };
    });

    const totalStockVal = reports.reduce((sum, report) => sum + report.stockValue, 0);
    
    const monthlyReportArray = Object.keys(monthlyData)
      .map(key => ({
        monthKey: key,
        ...monthlyData[key]
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));


    return { 
      productReports: reports, 
      totalStockValue: totalStockVal, 
      totalSalesValue: totalSalesVal, 
      totalProfit: calculatedTotalProfit,
      monthlyReport: monthlyReportArray
    };
  }, [products, sales, loading]);

  const renderSummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
       {loading ? (
        <>
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
        </>
       ) : (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">Shs {(totalStockValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Based on cost price</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">Shs {(totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Sum of all completed sales</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">Shs {(totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Calculated from sales vs cost</p>
                </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Months Reported</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.length}</div>
                <p className="text-xs text-muted-foreground">Total months with sales activity</p>
              </CardContent>
            </Card>
        </>
       )}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {renderSummaryCards()}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Report</CardTitle>
            <CardDescription>
              A breakdown of sales and profit by month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : monthlyReport.length > 0 ? (
                  monthlyReport.map(report => (
                    <TableRow key={report.monthKey}>
                      <TableCell className="font-medium">{report.monthLabel}</TableCell>
                      <TableCell className="text-right">
                        Shs {report.salesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        Shs {report.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No sales data to generate a monthly report.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Report</CardTitle>
            <CardDescription>
              Detailed breakdown of product inventory and sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-center">Current Stock</TableHead>
                  <TableHead className="text-center">Units Sold</TableHead>
                  <TableHead className="text-right">Stock Value (Cost)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : productReports.length > 0 ? (
                  productReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell className="text-center">{report.quantity}</TableCell>
                      <TableCell className="text-center">{report.unitsSold}</TableCell>
                      <TableCell className="text-right">
                        Shs {(report.stockValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No product data to generate a report.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter>
              <div className="text-xs text-muted-foreground">
                  Showing reports for <strong>{productReports.length}</strong> products.
              </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
