"use client";

import { useState } from "react";
import * as Papa from "papaparse";
import { toast } from "sonner";
import { Download, Upload as UploadIcon, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBulkCreateOrders } from "@/hooks/use-orders";
import type { BulkOrderResultItem } from "@/types/business";

export default function BulkCreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [results, setResults] = useState<BulkOrderResultItem[] | null>(null);
  const [summary, setSummary] = useState<{ requested: number; created: number; failed: number } | null>(null);

  const bulkCreate = useBulkCreateOrders();

  const generateTemplate = () => {
    // Generate a sample CSV template using papaparse
    const sampleData = [
      {
        pickup_address: "123 Business Park, Block A",
        pickup_lat: "12.9716",
        pickup_lng: "77.5946",
        pickup_contact_name: "John Sender",
        pickup_contact_phone: "9876543210",
        delivery_address: "456 Tech Park, Whitefield",
        delivery_lat: "12.9699",
        delivery_lng: "77.7499",
        delivery_contact_name: "Jane Receiver",
        delivery_contact_phone: "9123456780",
        delivery_type_id: "1",
        vehicle_category_id: "2",
        payment_method_id: "1",
        item_name: "Document Parcel",
        quantity: "1",
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shipzy_bulk_order_template.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    setFile(selectedFile);
    setResults(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        setParsedRows(results.data);
        setIsParsing(false);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setIsParsing(false);
      }
    });
  };

  const handleSubmit = () => {
    if (parsedRows.length === 0) return;
    
    if (parsedRows.length > 50) {
      toast.error("Maximum 50 orders supported per bulk upload currently.");
      return;
    }

    // Transform flat CSV rows into nested order objects expected by backend
    // Note: The backend expects an array of order objects similar to what
    // ordersService.createOrder takes. For the MVP, we assume a simple mapping.
    const payload = parsedRows.map(row => ({
      fulfillment: {
        deliveryTypeId: Number.parseInt(row.delivery_type_id, 10),
        vehicleCategoryId: Number.parseInt(row.vehicle_category_id, 10),
        paymentMethodId: Number.parseInt(row.payment_method_id, 10) || 1,
      },
      locations: {
        pickup: {
          fullAddress: row.pickup_address,
          latitude: Number.parseFloat(row.pickup_lat),
          longitude: Number.parseFloat(row.pickup_lng),
          contactName: row.pickup_contact_name,
          contactPhone: row.pickup_contact_phone,
        },
        delivery: {
          fullAddress: row.delivery_address,
          latitude: Number.parseFloat(row.delivery_lat),
          longitude: Number.parseFloat(row.delivery_lng),
          contactName: row.delivery_contact_name,
          contactPhone: row.delivery_contact_phone,
        }
      },
      items: [
        {
          name: row.item_name || "Package",
          quantity: Number.parseInt(row.quantity, 10) || 1,
        }
      ],
      package: {
        description: row.package_description,
        notifyRecipientSms: row.notify_sms?.toLowerCase() === "true",
      }
    }));

    bulkCreate.mutate(payload, {
      onSuccess: (res) => {
        setResults(res.data.bulk.results);
        setSummary({
          requested: res.data.bulk.requested,
          created: res.data.bulk.created,
          failed: res.data.bulk.failed,
        });
        toast.info(`Bulk creation completed: ${res.data.bulk.created} successful.`);
      },
      onError: (err: any) => {
        toast.error(err.message || "Bulk creation failed.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
       <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bulk Upload Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create up to 50 orders simultaneously via CSV spreadsheet.
          </p>
        </div>
        <Button variant="outline" onClick={generateTemplate}>
           <Download className="mr-2 h-4 w-4" /> Download CSV Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Upload Section */}
         <Card className="md:col-span-1 border-dashed border-2">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center h-[300px]">
             <FileSpreadsheet className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
             <h3 className="font-semibold text-lg mb-1">Select CSV File</h3>
             <p className="text-sm text-muted-foreground mb-6">
                Upload your filled template to import orders.
             </p>
             <div className="relative">
                <Button className="pointer-events-none">
                  <UploadIcon className="mr-2 h-4 w-4" /> Choose File
                </Button>
                <Input 
                   type="file" 
                   accept=".csv" 
                   onChange={handleFileUpload}
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
             </div>
             {file && (
                <p className="text-xs text-primary font-medium mt-4 bg-primary/10 px-3 py-1 rounded-full">
                  Selected: {file.name}
                </p>
             )}
           </CardContent>
         </Card>

         {/* Instructions Section */}
         <Card className="md:col-span-1">
           <CardHeader>
             <CardTitle className="text-base">Instructions</CardTitle>
           </CardHeader>
           <CardContent className="text-sm text-muted-foreground space-y-4">
             <ol className="list-decimal list-inside space-y-3">
                <li>Download the provided CSV template.</li>
                <li>Fill out each row. <strong>Coordinates (lat/lng) are strictly required</strong> for pricing to work.</li>
                <li>Save the file as a standard CSV (comma separated).</li>
                <li>Upload the file using the dropzone.</li>
                <li>Review the preview data and submit.</li>
             </ol>
             <Alert variant="default" className="mt-4 bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
               <AlertTitle className="text-xs font-bold flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-3 w-3" /> Tip
               </AlertTitle>
               <AlertDescription className="text-xs">
                 If you do not have exact coordinates, consider using the Draft Editor's map search tool instead of bulk upload.
               </AlertDescription>
             </Alert>
           </CardContent>
         </Card>
      </div>

      {/* Preview Section */}
      {parsedRows.length > 0 && !results && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
             <div>
               <CardTitle>Preview Data</CardTitle>
               <CardDescription>Found {parsedRows.length} valid rows.</CardDescription>
             </div>
             <Button onClick={handleSubmit} disabled={bulkCreate.isPending}>
               {bulkCreate.isPending ? "Processing..." : `Submit ${parsedRows.length} Orders`}
             </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Pickup Address</th>
                    <th className="px-4 py-3">Delivery Address</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                     <tr key={`preview-row-${idx}`} className="hover:bg-muted/30">
                       <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                       <td className="px-4 py-3"><div className="line-clamp-2 w-48">{row.pickup_address}</div></td>
                       <td className="px-4 py-3"><div className="line-clamp-2 w-48">{row.delivery_address}</div></td>
                       <td className="px-4 py-3 text-xs">{row.delivery_contact_name}</td>
                       <td className="px-4 py-3 text-xs">{row.quantity}x {row.item_name}</td>
                     </tr>
                  ))}
                  {parsedRows.length > 10 && (
                     <tr>
                        <td colSpan={5} className="px-4 py-5 text-center text-muted-foreground font-medium bg-muted/10">
                           ... and {parsedRows.length - 10} more rows
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && summary && (
         <Card className="border-green-200 dark:border-green-900 animate-in fade-in zoom-in-95">
           <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900/50">
             <div className="flex items-center gap-3">
               <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
               <div>
                  <CardTitle className="text-green-900 dark:text-green-300">Processing Complete</CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-400">
                    Successfully created {summary.created} out of {summary.requested} orders.
                  </CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="p-0">
             <div className="max-h-[300px] overflow-y-auto">
                <ul className="divide-y">
                   {results.map((r, i) => (
                      <li key={`result-row-${i}`} className="flex items-start gap-3 p-4 text-sm">
                        {r.success ? (
                           <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                           <XCircle className="h-5 w-5 text-destructive shrink-0" />
                        )}
                        <div>
                           <p className="font-medium">Row {r.index + 1}</p>
                           {r.success ? (
                              <p className="text-muted-foreground text-xs mt-0.5">Order ID #{r.orderId} created.</p>
                           ) : (
                              <p className="text-destructive text-xs mt-0.5">{r.error}</p>
                           )}
                        </div>
                      </li>
                   ))}
                </ul>
             </div>
           </CardContent>
         </Card>
      )}
    </div>
  );
}
