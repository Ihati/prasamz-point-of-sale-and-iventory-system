'use client';
import { useState } from 'react';
import { estimateBundlePrice, EstimateBundlePriceInput, EstimateBundlePriceOutput } from '@/ai/flows/estimate-bundle-price';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type EstimateBundlePriceProps = {
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
  customerName: string;
};

export function EstimateBundlePrice({ products, customerName }: EstimateBundlePriceProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateBundlePriceOutput | null>(null);
  const { toast } = useToast();

  const handleEstimate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const input: EstimateBundlePriceInput = { products, customerName };
      const estimation = await estimateBundlePrice(input);
      setResult(estimation);
    } catch (error) {
      console.error('Error estimating price:', error);
      toast({
        title: 'Error',
        description: 'Failed to estimate bundle price. Please try again.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Bundle Price Estimator</DialogTitle>
        <DialogDescription>
          Get a price estimate for this bundle, considering products and customer details.
        </DialogDescription>
      </DialogHeader>

      {result ? (
        <div className="my-4 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Estimated Price</p>
            <p className="text-4xl font-bold">Shs {result.estimatedPrice.toFixed(2)}</p>
          </div>
          <div className="rounded-md border bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">Reasoning</h4>
            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
          </div>
        </div>
      ) : (
        <div className="my-4 h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Click below to generate an estimate.</p>
        </div>
      )}

      <DialogFooter>
        <Button onClick={handleEstimate} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {result ? 'Re-estimate Price' : 'Estimate Price'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
