
'use client';
import { Upload, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/lib/placeholder-data';
import * as XLSX from 'xlsx';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';


export default function UploadStockPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadProducts } = useProducts();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleDownloadTemplate = () => {
    const headers = ['Product Name', 'Category', 'Quantity', 'Cost Price', 'Wholesale Price', 'Retail Price'];
    const exampleData = [{
      'Product Name': 'Example Motorbike Helmet',
      'Category': 'Helmets',
      'Quantity': 30,
      'Cost Price': 110.00,
      'Wholesale Price': 140.00,
      'Retail Price': 175.00,
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers, skipHeader: false });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });


    XLSX.writeFile(workbook, 'stock_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUploadFile = useCallback(async () => {
    if (!selectedFile) {
       toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval:'' })[0] as string[];

        if (!headerRow) {
          throw new Error('Could not read headers from the Excel file. Is it empty?');
        }

        const requiredHeaders = ['Product Name', 'Category', 'Quantity', 'Cost Price', 'Wholesale Price', 'Retail Price'];
        const actualHeaders = headerRow.map(h => String(h).trim());
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Your file is missing required columns: ${missingHeaders.join(', ')}`);
        }
        
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: null, // Important: keep empty cells as null
        });

        if (json.length === 0) {
          throw new Error('Excel file has headers but no data rows.');
        }

        const productsToUpload: Omit<Product, 'id' | 'createdAt'>[] = json.map((row) => {
          const productName = String(row['Product Name'] || '').trim();
          
          if (!productName) {
            return null;
          }

          const costPrice = parseFloat(row['Cost Price']) || 0;
          const retailPrice = parseFloat(row['Retail Price']) || 0;
          const wholesalePrice = parseFloat(row['Wholesale Price']) || 0;
          const quantity = parseInt(String(row['Quantity']), 10) || 0;
          
          return {
            name: productName,
            category: String(row['Category'] || ''),
            costPrice: costPrice,
            retailPrice: retailPrice,
            wholesalePrice: wholesalePrice,
            quantity: quantity,
          };
        }).filter((p): p is Omit<Product, 'id' | 'createdAt'> => p !== null);

        if (productsToUpload.length === 0) {
          throw new Error('No valid product data found to upload.');
        }

        await uploadProducts(productsToUpload, (progress) => {
          setUploadProgress(progress);
        });
        toast({ title: 'Upload Successful', description: `${productsToUpload.length} products have been added.` });

      } catch (error: any) {
        console.error("Error processing file:", error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'There was an error processing your file. Please ensure it is a valid Excel file with the correct headers.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    
    reader.onerror = () => {
       setLoading(false);
       toast({
          title: 'File Read Error',
          description: 'Could not read the selected file.',
          variant: 'destructive'
        });
    };

    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, toast, uploadProducts]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload Stock</CardTitle>
          <CardDescription>
            Bulk import your products from an Excel file. Use the template to ensure the format is correct.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/20"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                {selectedFile ? (
                  <>
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click again or drag to change</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      XLSX (MAX. 5MB)
                    </p>
                  </>
                )}
              </div>
              <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" disabled={loading} />
            </label>
            {loading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">Uploading... {uploadProgress.toFixed(0)}%</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleDownloadTemplate} disabled={loading}>
            Download Template
          </Button>
          <Button onClick={handleUploadFile} disabled={loading || !selectedFile}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload File
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
