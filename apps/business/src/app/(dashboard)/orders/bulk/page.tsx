"use client";

import { useState } from "react";
import * as Papa from "papaparse";
import { toast } from "sonner";
import { Download, Upload as UploadIcon, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
    const sampleData = [
      {
        pickup_address: "123 Business Park, Block A, City",
        pickup_contact_name: "John Sender",
        pickup_contact_phone: "9876543210",
        pickup_building: "Block A",
        pickup_floor: "1",
        pickup_flat_number: "101",
        delivery_address: "456 Tech Park, Whitefield, City",
        delivery_contact_name: "Jane Receiver",
        delivery_contact_phone: "9123456780",
        delivery_building: "Tech Park",
        delivery_floor: "3",
        delivery_flat_number: "305",
        delivery_type_id: "1",
        vehicle_category_id: "2",
        weight_tier_id: "1",
        payment_method_id: "1",
        item_name: "Document Parcel",
        quantity: "1",
        package_description: "Fragile documents",
        notify_sms: "true"
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
    setIsParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const data = results.data.filter((r: any) => Object.values(r).some(v => v !== ""));
        
        const validated = data.map((row: any) => {
          const errors = [];
          if (!row.pickup_address || row.pickup_address.length < 5) errors.push("Missing or short pickup address");
          if (!row.pickup_contact_phone || row.pickup_contact_phone.length < 10) errors.push("Invalid pickup phone");
          if (!row.delivery_address || row.delivery_address.length < 5) errors.push("Missing or short delivery address");
          if (!row.delivery_contact_phone || row.delivery_contact_phone.length < 10) errors.push("Invalid delivery phone");
          if (!row.delivery_type_id) errors.push("Missing delivery type ID");
          if (!row.vehicle_category_id) errors.push("Missing vehicle category ID");
          
          return { ...row, _errors: errors };
        });

        setParsedRows(validated);
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

    const hasErrors = parsedRows.some(row => row._errors.length > 0);
    if (hasErrors) {
      toast.error("Please fix errors in the CSV before submitting.");
      return;
    }

    const payload = parsedRows.map(row => ({
      fulfillment: {
        deliveryTypeId: Number.parseInt(row.delivery_type_id, 10),
        vehicleCategoryId: Number.parseInt(row.vehicle_category_id, 10),
        weightTierId: Number.parseInt(row.weight_tier_id, 10) || 1,
        paymentMethodId: Number.parseInt(row.payment_method_id, 10) || 1,
      },
      pickup: {
        address: row.pickup_address,
        contactName: row.pickup_contact_name || "Sender",
        contactPhone: row.pickup_contact_phone,
        building: row.pickup_building || undefined,
        floor: row.pickup_floor || undefined,
        flatNumber: row.pickup_flat_number || undefined,
      },
      delivery: {
        address: row.delivery_address,
        contactName: row.delivery_contact_name || "Receiver",
        contactPhone: row.delivery_contact_phone,
        building: row.delivery_building || undefined,
        floor: row.delivery_floor || undefined,
        flatNumber: row.delivery_flat_number || undefined,
      },
      items: [
        {
          itemName: row.item_name || "Package",
          quantity: Number.parseInt(row.quantity, 10) || 1,
        }
      ],
      package: {
        description: row.package_description || undefined,
        notifyRecipientSms: String(row.notify_sms).toLowerCase() === "true",
      }
    }));

    bulkCreate.mutate(payload as any, {
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

  const hasAnyErrors = parsedRows.some(row => row._errors?.length > 0);

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
         <Card className="md:col-span-1 border-dashed border-2 bg-muted/10">
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
             {isParsing && <p className="text-xs text-muted-foreground mt-2 animate-pulse">Parsing...</p>}
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
                <li>Fill out each row. Provide <strong>full text addresses</strong> (e.g., "123 Business Park, City, State").</li>
                <li>No exact coordinates required! Our system will automatically find the location.</li>
                <li>Save the file as a standard CSV (comma separated).</li>
                <li>Upload the file and fix any highlighted errors before submitting.</li>
             </ol>
             <Alert variant="default" className="mt-4 bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
               <AlertTitle className="text-xs font-bold flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-3 w-3" /> Auto-Pricing
               </AlertTitle>
               <AlertDescription className="text-xs">
                 The backend will automatically geocode your addresses and calculate the best fare for each row based on the selected vehicle.
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
               <CardDescription>Found {parsedRows.length} rows.</CardDescription>
             </div>
             <Button 
               onClick={handleSubmit} 
               disabled={bulkCreate.isPending || hasAnyErrors}
               className={hasAnyErrors ? "bg-muted text-muted-foreground" : "gradient-brand text-primary-foreground"}
             >
               {bulkCreate.isPending ? "Processing..." : hasAnyErrors ? "Fix Errors to Submit" : `Submit ${parsedRows.length} Orders`}
             </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Pickup Address</th>
                    <th className="px-4 py-3">Delivery Address</th>
                    <th className="px-4 py-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.slice(0, 50).map((row, idx) => {
                     const errors = row._errors || [];
                     return (
                     <tr key={`preview-row-${idx}`} className={errors.length > 0 ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-muted/30"}>
                       <td className="px-4 py-3">
                         {errors.length > 0 ? (
                           <Badge variant="destructive" className="flex items-center gap-1 w-max">
                             <AlertCircle className="w-3 h-3" /> Error
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">Valid</Badge>
                         )}
                       </td>
                       <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                       <td className="px-4 py-3">
                         <div className="line-clamp-2 w-48 text-xs">{row.pickup_address}</div>
                         {errors.some((e: string) => e.includes("pickup")) && (
                           <p className="text-[10px] text-destructive mt-1">{errors.find((e: string) => e.includes("pickup"))}</p>
                         )}
                       </td>
                       <td className="px-4 py-3">
                         <div className="line-clamp-2 w-48 text-xs">{row.delivery_address}</div>
                         {errors.some((e: string) => e.includes("delivery")) && (
                           <p className="text-[10px] text-destructive mt-1">{errors.find((e: string) => e.includes("delivery"))}</p>
                         )}
                       </td>
                       <td className="px-4 py-3 text-xs">{row.delivery_contact_phone}</td>
                     </tr>
                  )})}
                  {parsedRows.length > 50 && (
                     <tr>
                        <td colSpan={5} className="px-4 py-5 text-center text-muted-foreground font-medium bg-muted/10">
                           Maximum 50 rows allowed. Please remove {parsedRows.length - 50} rows from your CSV.
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
                      <li key={`result-row-${i}`} className={`flex items-start gap-3 p-4 text-sm hover:bg-muted/30 ${r.isDraft ? 'bg-yellow-50/30 dark:bg-yellow-950/10' : ''}`}>
                        {r.success ? (
                           r.isDraft ? (
                             <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                           ) : (
                             <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                           )
                        ) : (
                           <XCircle className="h-5 w-5 text-destructive shrink-0" />
                        )}
                        <div>
                           <p className="font-medium">Row {r.index + 1}</p>
                           {r.success ? (
                              r.isDraft ? (
                                <p className="text-yellow-700 dark:text-yellow-500 text-xs mt-0.5">
                                  Draft ID #{r.draftId} created. {r.error}
                                </p>
                              ) : (
                                <p className="text-muted-foreground text-xs mt-0.5">Order ID #{r.orderId} created.</p>
                              )
                           ) : (
                              <p className="text-destructive text-xs mt-0.5 font-medium">{r.error}</p>
                           )}
                        </div>
                      </li>
                   ))}
                </ul>
             </div>
           </CardContent>
           <div className="p-4 border-t bg-muted/20">
             <Button variant="outline" onClick={() => { setResults(null); setFile(null); setParsedRows([]); }}>
               Start New Upload
             </Button>
           </div>
         </Card>
      )}
    </div>
  );
}
