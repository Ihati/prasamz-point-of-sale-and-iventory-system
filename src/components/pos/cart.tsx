
'use client';

import * as React from 'react';
import { Plus, Minus, X, Receipt, Printer } from 'lucide-react';

import type { Product, PriceType, Sale, SaleItem, User } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input }from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { EstimateBundlePrice } from './estimate-bundle-price';
import { useProducts } from '@/hooks/use-products';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/use-user';
import { Loader2 } from 'lucide-react';

const ReceiptPreview = React.forwardRef<HTMLDivElement, { sale: Sale, user: User | null }>(({ sale, user }, ref) => {
  const [formattedDate, setFormattedDate] = React.useState('');

  React.useEffect(() => {
    if (sale?.createdAt) {
      const date = sale.createdAt.seconds ? new Date(sale.createdAt.seconds * 1000) : new Date(sale.createdAt);
      setFormattedDate(date.toLocaleString());
    }
  }, [sale?.createdAt]);
  
  if (!sale) return null;

  const subtotal = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div ref={ref} className="receipt-preview bg-white text-black px-2 py-4 font-mono text-sm max-w-xs mx-auto">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold uppercase">Prasamz Spares</h2>
        <p className="text-xs font-bold">Motorbike and bicycle accessories</p>
        <p className="text-xs">K7 Building, Nyamakima, 1st Floor, Shop 57</p>
        <p className="text-xs font-bold">Call: 0713-702-111 / 0721-268-951</p>
      </div>
      <hr className="border-dashed border-black mb-2" />
      <div className="flex justify-between text-xs">
        <span>Date:</span>
        <span>{formattedDate}</span>
      </div>
      <div className="flex justify-between text-xs mb-1">
        <span>Served by:</span>
        <span>Peter</span>
      </div>
      <hr className="border-dashed border-black my-2" />
      <div className="w-full text-xs">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left font-bold pr-1">Item</th>
                <th className="text-center font-bold">Qty</th>
                <th className="text-right font-bold pr-2">Unit Price</th>
                <th className="text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-left pr-1">{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right pr-2">{item.price.toLocaleString()}</td>
                  <td className="text-right">{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      <hr className="border-dashed border-black my-2" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Shs {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>Total:</span>
          <span>Shs {subtotal.toLocaleString()}</span>
        </div>
      </div>
      <hr className="border-dashed border-black my-2" />
      <p className="text-center text-xs mt-2">Thank you for shopping with us!</p>
      <p className="text-center text-xs mt-1">For pos and ICT solutions contact : 0758515042</p>
    </div>
  );
});
ReceiptPreview.displayName = 'ReceiptPreview';


export function Cart() {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [customerName, setCustomerName] = React.useState('');
  const [openAiEstimator, setOpenAiEstimator] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<Sale | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const { toast } = useToast();
  const { updateProductQuantity } = useProducts();
  const { user, addSale } = useUser();
  const receiptRef = React.useRef<HTMLDivElement>(null);


  // Handle adding products to cart
  React.useEffect(() => {
    const handleAddToCart = (event: Event) => {
      const customEvent = event as CustomEvent<{ product: Product; priceType: PriceType }>;
      const { product: productToAdd, priceType } = customEvent.detail;
      const price = priceType === 'retail' ? productToAdd.retailPrice : productToAdd.wholesalePrice;
      const cartItemId = `${productToAdd.id}-${priceType}`;
      
      let toastMessage: { title: string; description: string; variant?: 'destructive' } | null = null;
      
      setItems((prevItems) => {
        let nextItems = [...prevItems];
        const existingItem = prevItems.find(i => i.cartItemId === cartItemId);
        
        if (existingItem) {
          if (existingItem.cartQuantity >= productToAdd.quantity) {
            toastMessage = { title: 'Out of Stock', description: `Only ${productToAdd.quantity} left in stock.`, variant: 'destructive' };
            return prevItems;
          }
          toastMessage = { title: `${productToAdd.name} updated`, description: 'Quantity updated in cart.' };
          nextItems = prevItems.map(i => i.cartItemId === cartItemId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
        } else {
          if (productToAdd.quantity < 1) {
            toastMessage = { title: 'Out of Stock', description: `${productToAdd.name} is out of stock.`, variant: 'destructive' };
            return prevItems;
          }
          toastMessage = { title: `${productToAdd.name} added`, description: `Added with ${priceType} price.` };
          nextItems = [...prevItems, { ...productToAdd, cartQuantity: 1, priceType, price, cartItemId }];
        }
        return nextItems;
      });

      // Show toast after state update has been queued
      setTimeout(() => {
        if (toastMessage) {
          toast(toastMessage);
        }
      }, 0);
    };

    window.addEventListener('addToCart', handleAddToCart);
    return () => window.removeEventListener('addToCart', handleAddToCart);
  }, [toast]);

  // Update cart quantity
  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    const product = items.find(item => item.cartItemId === cartItemId);
    if (product && newQuantity > product.quantity) {
      toast({ title: 'Stock Limit Reached', description: `Only ${product.quantity} of ${product.name} available.`, variant: 'destructive' });
      return;
    }
    setItems(prevItems => {
      if (newQuantity <= 0) return prevItems.filter(i => i.cartItemId !== cartItemId);
      return prevItems.map(i => i.cartItemId === cartItemId ? { ...i, cartQuantity: newQuantity } : i);
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems(prevItems => prevItems.filter(i => i.cartItemId !== cartItemId));
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
  const grandTotal = subtotal;

  // Process sale
  const handleProcessSale = async () => {
    if (!user) return toast({ title: 'Not logged in', description: 'Please login.', variant: 'destructive' });
    if (items.length === 0) return toast({ title: 'Cart is empty', description: 'Add products first.', variant: 'destructive' });
    
    setProcessing(true);
    try {
      const saleItemsForDb: SaleItem[] = items.map(i => ({
        productId: i.id,
        name: i.name,
        quantity: i.cartQuantity,
        price: i.price,
        priceType: i.priceType
      }));

      const newSaleId = await addSale({ customerName: customerName || 'N/A', items: saleItemsForDb });

      if (newSaleId) {
        await Promise.all(items.map(item => updateProductQuantity(item.id, -item.cartQuantity)));

        const saleDataForReceipt: Sale = {
          id: newSaleId,
          customerName: customerName || 'N/A',
          items: saleItemsForDb,
          createdAt: new Date(),
          userId: user.id
        };

        setLastSale(saleDataForReceipt);
        setShowReceipt(true);
        setItems([]);
        setCustomerName('');

        toast({ title: 'Sale Processed', description: `Sale for ${customerName || 'N/A'} totaling Shs ${grandTotal.toFixed(2)} recorded.` });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };
  
  const handlePrint = () => {
    const receiptContent = receiptRef.current;
    if (!receiptContent) {
      toast({ title: 'Print Error', description: 'Could not find receipt content to print.', variant: 'destructive' });
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Receipt</title>');
      printWindow.document.write(`
        <style>
          body { 
            margin: 0; 
            padding: 10px; 
            font-family: monospace; 
            font-size: 10pt;
          }
          .receipt-preview { 
            width: 100%; 
            max-width: 320px;
            margin: 0 auto;
            background: white; 
            color: black; 
          }
           hr {
            border: none;
            border-top: 1px dashed black;
          }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .pr-1 { padding-right: 0.25rem; }
          .pr-2 { padding-right: 0.5rem; }
          .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
          .uppercase { text-transform: uppercase; }
          .text-lg { font-size: 1.125rem; }
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .space-y-1 > :not([hidden]) ~ :not([hidden]) {
            --tw-space-y-reverse: 0;
            margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));
            margin-bottom: calc(0.25rem * var(--tw-space-y-reverse));
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { vertical-align: top; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      
      const receiptHTML = receiptRef.current.innerHTML;
      printWindow.document.body.innerHTML = receiptHTML;
      
      setTimeout(() => {
        try {
          printWindow.print();git push -u origin main

        } finally {
          printWindow.close();
        }
      }, 250);

    } else {
      toast({ title: 'Print Error', description: 'Could not open print window. Please disable your pop-up blocker.', variant: 'destructive' });
    }
  };


  const estimatorProducts = items.map(i => ({ name: i.name, quantity: i.cartQuantity, price: i.price }));

  return (
    <>
      <Card className="sticky top-6 non-printable">
        <CardHeader>
          <CardTitle>Cart</CardTitle>
          <CardDescription>Manage items for the current sale.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Customer Name (Optional)</Label>
            <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" disabled={processing} />
          </div>
          <Separator />
          <ScrollArea className="h-64 pr-4">
            {items.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {items.map(item => (
                  <div key={item.cartItemId} className="flex items-center gap-4">
                    <div className="flex-1 grid gap-1 text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.cartItemId, item.cartQuantity - 1)} disabled={processing}><Minus className="h-3 w-3" /></Button>
                        <span>{item.cartQuantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.cartItemId, item.cartQuantity + 1)} disabled={processing}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="text-sm font-medium">Shs {(item.price * item.cartQuantity).toFixed(2)}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeItem(item.cartItemId)} disabled={processing}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Shs {subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-bold text-base">
              <span>Grand Total</span>
              <span>Shs {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {items.length > 0 && user?.role === 'admin' && (
            <Dialog open={openAiEstimator} onOpenChange={setOpenAiEstimator}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={processing}>Estimate Bundle Price</Button>
              </DialogTrigger>
              <EstimateBundlePrice products={estimatorProducts} customerName={customerName || 'Valued Customer'} />
            </Dialog>
          )}
          <Button className="w-full" onClick={handleProcessSale} disabled={processing || items.length === 0}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Receipt className="mr-2 h-4 w-4" /> Process Sale & View Receipt
          </Button>
        </CardFooter>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Preview of the sale receipt.</DialogDescription>
          </DialogHeader>
          <div className="printable-area -mx-6 sm:mx-0 my-4 sm:my-0 sm:rounded-lg overflow-hidden">
            {lastSale && <ReceiptPreview sale={lastSale} user={user} ref={receiptRef}/>}
          </div>
          <DialogFooter className='sm:justify-between gap-2 mt-4'>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>Close</Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// This defines the type for an item in the cart, extending the product with cart-specific properties.
// It's not a database model but a type for the component's state.
type CartItem = Product & {
  cartQuantity: number;
  priceType: PriceType;
  price: number;
  cartItemId: string; // A unique ID for the item in the cart (e.g., product.id + '-' + priceType)
};
