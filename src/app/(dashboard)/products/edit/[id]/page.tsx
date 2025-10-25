
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user.tsx';
import { Product } from '@/lib/placeholder-data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { products, updateProduct, loading: productsLoading } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const id = params.id;

  useEffect(() => {
    if (productsLoading) return; // Wait for products to be loaded
    if (user?.role !== 'admin') {
      router.push('/products');
      return;
    }
    const productToEdit = products.find((p) => p.id === id);
    if (productToEdit) {
      setProduct(productToEdit);
    } else if (products.length > 0) {
      toast({ title: 'Product not found', variant: 'destructive' });
      router.push('/products');
    }
  }, [user, id, router, products, toast, productsLoading]);
  
  const handleSave = async () => {
    if (product) {
      setLoading(true);
      try {
        await updateProduct(product);
        toast({ title: 'Product Updated', description: `${product.name} has been updated.` });
        router.push('/products');
      } catch (error) {
        // Error toast is handled by the hook
        console.error("Failed to update product:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (productsLoading || !product) {
    return (
        <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Loading Product...</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Please wait while we fetch the product details.
                </p>
            </div>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Product</CardTitle>
        <CardDescription>
          Update the details for {product.name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={product.name || ''} onChange={(e) => setProduct({ ...product, name: e.target.value })} disabled={loading}/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={product.category || ''} onChange={(e) => setProduct({ ...product, category: e.target.value })} disabled={loading}/>
            </div>
            <div className="grid grid-cols-3 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="costPrice">Cost Price (Shs)</Label>
                    <Input id="costPrice" type="number" value={product.costPrice || 0} onChange={(e) => setProduct({ ...product, costPrice: parseFloat(e.target.value) || 0 })} disabled={loading}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="retailPrice">Retail Price (Shs)</Label>
                    <Input id="retailPrice" type="number" value={product.retailPrice || 0} onChange={(e) => setProduct({ ...product, retailPrice: parseFloat(e.target.value) || 0 })} disabled={loading}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="wholesalePrice">Wholesale Price (Shs)</Label>
                    <Input id="wholesalePrice" type="number" value={product.wholesalePrice || 0} onChange={(e) => setProduct({ ...product, wholesalePrice: parseFloat(e.target.value) || 0 })} disabled={loading}/>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={product.quantity || 0} onChange={(e) => setProduct({ ...product, quantity: parseInt(e.target.value) || 0 })} disabled={loading}/>
            </div>
            <div className='flex justify-end gap-2 mt-4'>
                <Button variant="outline" onClick={() => router.push('/products')} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
