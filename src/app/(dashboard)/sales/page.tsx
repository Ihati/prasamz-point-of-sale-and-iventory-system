
'use client';

import * as React from 'react';
import { File, Loader2, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSales } from '@/hooks/use-sales';
import { useUser } from '@/hooks/use-user';
import { Sale } from '@/lib/placeholder-data';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

function normalizeDate(date: any): Date {
  if (!date) return new Date(0); 
  if (date && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
  }
  if (date instanceof Date) {
    return date;
  }
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  return new Date(0);
}

const SaleRow = ({ sale, user, onDelete }: { sale: Sale, user: any, onDelete: (sale: Sale) => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const totalAmount = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <>
            <TableRow className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{sale.id}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{sale.customerName}</TableCell>
                <TableCell className="text-right cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    Shs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{normalizeDate(sale.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                       {user?.role === 'admin' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(sale);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Sale</span>
                        </Button>
                       )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="sr-only">{isOpen ? 'Collapse' : 'Expand'}</span>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            <Collapsible open={isOpen} asChild>
                <CollapsibleContent asChild>
                    <tr>
                        <TableCell colSpan={5} className="p-0">
                            <div className="p-4 bg-muted/20">
                                <h4 className="font-semibold text-sm mb-2">Items in Sale</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.items.map((item, index) => (
                                            <TableRow key={index} className="bg-muted/40">
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell><Badge variant={item.priceType === 'retail' ? 'secondary' : 'outline'}>{item.priceType}</Badge></TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">Shs {item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">Shs {(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TableCell>
                    </tr>
                </CollapsibleContent>
            </Collapsible>
        </>
    );
};


export default function SalesHistoryPage() {
  const { sales, loading, deleteSale } = useSales();
  const { user } = useUser();
  const { toast } = useToast();
  const [saleToDelete, setSaleToDelete] = React.useState<Sale | null>(null);


  const handleExport = () => {
    if (sales.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no sales to export.',
        variant: 'destructive',
      });
      return;
    }
    
    const headers = ['Sale ID', 'Customer', 'Product Name', 'Price Type', 'Quantity', 'Unit Price', 'Item Total', 'Sale Date'];
    const csvRows: string[] = [headers.join(',')];

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const row = [
          sale.id,
          `"${sale.customerName}"`,
          `"${item.name}"`,
          item.priceType,
          item.quantity,
          item.price.toFixed(2),
          (item.price * item.quantity).toFixed(2),
          normalizeDate(sale.createdAt).toISOString(),
        ];
        csvRows.push(row.join(','));
      });
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'sales_history_detailed.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: 'Your detailed sales history has been downloaded.',
    });
  };

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      await deleteSale(saleToDelete.id);
      toast({
        title: 'Sale Deleted',
        description: `Sale record ${saleToDelete.id} has been removed.`,
      });
      setSaleToDelete(null);
    }
  };


  const renderContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            <div className="flex justify-center items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Fetching sales records...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (sales.length > 0) {
      return sales.map((sale) => (
        <SaleRow key={sale.id} sale={sale} user={user} onDelete={handleDeleteClick} />
      ));
    }

    return (
      <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No sales found.
          </TableCell>
      </TableRow>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            View and export your entire sales history. Click a row to see details.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={sales.length === 0 || loading}>
            <File className="mr-2 h-4 w-4" />
            Export Detailed
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderContent()}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter className="flex justify-between items-center py-4">
        <div className="text-xs text-muted-foreground">
          Showing <strong>{sales.length}</strong> sales.
        </div>
      </CardFooter>
    </Card>

    <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the sale record
            with ID &quot;{saleToDelete?.id}&quot; and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
