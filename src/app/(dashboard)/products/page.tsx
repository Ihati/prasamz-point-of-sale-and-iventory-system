
'use client';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
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
import { Product } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function ProductsPage() {
  const { user } = useUser();
  const { products, deleteProduct, deleteAllProducts, searchTerm, loading } = useProducts();
  const router = useRouter();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);


  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`);
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      toast({
        title: 'Product Deleted',
        description: `${productToDelete.name} has been removed from the inventory.`,
      });
      setProductToDelete(null);
    }
  };

  const confirmDeleteAll = async () => {
    await deleteAllProducts();
    toast({
      title: 'All Products Deleted',
      description: 'The entire product inventory has been cleared.',
    });
    setIsDeleteAllDialogOpen(false);
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                Manage your products and view their inventory.
                </CardDescription>
            </div>
            {user?.role === 'admin' && (
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setIsDeleteAllDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                    </Button>
                    <Button asChild>
                        <Link href="/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Product
                        </Link>
                    </Button>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Cost Price</TableHead>
              <TableHead className="hidden md:table-cell">Retail Price</TableHead>
              <TableHead className="hidden md:table-cell">Wholesale Price</TableHead>
              <TableHead className="hidden md:table-cell">
                Quantity
              </TableHead>
              {user?.role === 'admin' && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  {user?.role === 'admin' && (
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  )}
                </TableRow>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      Shs {(product.costPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      Shs {(product.retailPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      Shs {(product.wholesalePrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.quantity}
                    </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleEdit(product.id)}}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(product); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="h-24 text-center">
                  No products found {searchTerm ? `matching "${searchTerm}"` : 'in the database.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
        </div>
      </CardFooter>
    </Card>
    <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the product
            &quot;{productToDelete?.name}&quot; and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all
                products from your inventory.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAll}>
                Yes, delete all products
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
