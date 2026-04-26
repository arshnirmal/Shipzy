"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/use-templates";
import type { Template } from "@/types/business";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(255).optional(),
});

type TemplateFormDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly template?: Template | null; // If passed, we are editing
};

export function TemplateFormDialog({ open, onOpenChange, template }: TemplateFormDialogProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (template) {
        form.reset({
          name: template.name,
          description: template.description || "",
        });
      } else {
        form.reset({ name: "", description: "" });
      }
    }
  }, [open, template, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // For MVp, we just take the name & description and leave other struct fields empty 
    // to be filled out via a full "edit template layout" later, or we just allow 
    // basic creation and they add fields by "using" it and then "save as template" from an order.
    // For now, doing a basic create.
    const payload = {
      name: values.name,
      description: values.description || undefined,
      items: [], // ensure empty array per struct
    };

    if (template) {
      updateTemplate.mutate(
        { id: template.templateId, payload },
        { 
          onSuccess: () => onOpenChange(false) 
        }
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {template 
              ? "Update the details for this template." 
              : "Create a reusable template for common orders."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekly Office Supply Run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief note about what this is for..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
