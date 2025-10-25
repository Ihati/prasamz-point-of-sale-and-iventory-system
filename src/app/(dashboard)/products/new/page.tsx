
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
import type { Product } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function NewProductPage() {
  const { user } = useUser();
  const router = useRouter();
  const { addProduct } = useProducts();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    costPrice: '',
    retailPrice: '',
    wholesalePrice: '',
    quantity: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/products');
    }
  }, [user, router]);
  
  const handleSave = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.costPrice || !newProduct.retailPrice || !newProduct.wholesalePrice || !newProduct.quantity) {
        toast({
            title: 'Missing Fields',
            description: 'Please fill out all required product details.',
            variant: 'destructive',
        });
        return;
    }
    
    setLoading(true);

    const productToAdd: Omit<Product, 'id' | 'createdAt'> = {
      name: newProduct.name,
      category: newProduct.category,
      costPrice: parseFloat(newProduct.costPrice),
      retailPrice: parseFloat(newProduct.retailPrice),
      wholesalePrice: parseFloat(newProduct.wholesalePrice),
      quantity: parseInt(newProduct.quantity),
    };

    const newProductId = await addProduct(productToAdd);
    
    setLoading(false);

    if (newProductId) {
      toast({
        title: 'Product Added',
        description: `${productToAdd.name} has been added to the inventory.`,
      });
      router.push('/products');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewProduct(prev => ({ ...prev, [id]: value }));
  }

  if (user?.role !== 'admin') {
    return <div>Redirecting...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>
          Fill in the details below to add a new product to your inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={newProduct.name} onChange={handleInputChange} placeholder="e.g., Premium Bicycle Helmet" disabled={loading} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={newProduct.category} onChange={handleInputChange} placeholder="e.g., Helmets" disabled={loading} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="costPrice">Cost Price (Shs)</Label>
                    <Input id="costPrice" type="number" value={newProduct.costPrice} onChange={handleInputChange} placeholder="e.g., 100" disabled={loading} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="retailPrice">Retail Price (Shs)</Label>
                    <Input id="retailPrice" type="number" value={newProduct.retailPrice} onChange={handleInputChange} placeholder="e.g., 150" disabled={loading} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="wholesalePrice">Wholesale Price (Shs)</Label>
                    <Input id="wholesalePrice" type="number" value={newProduct.wholesalePrice} onChange={handleInputChange} placeholder="e.g., 120" disabled={loading} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={newProduct.quantity} onChange={handleInputChange} placeholder="e.g., 50" disabled={loading} />
            </div>
            <div className='flex justify-end gap-2 mt-4'>
                <Button variant="outline" onClick={() => router.push('/products')} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Product
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
