import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddEntry, useUpdateEntry } from "@/hooks/useLedger";
import { useEntities } from "@/hooks/useEntities";
import { Combobox } from "@/components/ui/combobox";
import { navigationItems } from "@/lib/navigation";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { Loader2, HelpCircle } from "lucide-react";

const formSchema = z.object({
  kind: z.enum([
    "in",
    "out",
    "sub",
    "person_in",
    "person_out",
    "loan_given",
    "loan_taken",
    "fund_received",
    "settlement_in",
    "settlement_out",
    "transfer"
  ]),
  amount: z.string().min(1, "Amount is required"),
  note: z.string().min(1, "Note is required"),
  person: z.string().nullish(),
  sourceAccount: z.string().nullish(),
  destinationAccount: z.string().nullish(),
  date: z.string().nullish(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<FormValues> & { id?: string };
}

export function TransactionModal({ open, onOpenChange, defaultValues }: TransactionModalProps) {
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const navigate = useNavigate();
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities();
  const { t, currencySymbol } = useSettings();

  const entities = entitiesData?.entities || [];
  
  const personOptions = entities
    .filter((e: any) => ["PERSON", "ORGANIZATION", "UTILITY", "FAMILY"].includes(e.type))
    .map((e: any) => ({ label: e.name, value: e.name }));

  const accountOptions = entities
    .filter((e: any) => e.type === "ACCOUNT")
    .map((e: any) => ({ label: e.name, value: e.name }));

  const isEdit = !!defaultValues?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "out",
      amount: "",
      note: "",
      person: "",
      sourceAccount: "",
      destinationAccount: "",
      date: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      const formattedDate = defaultValues?.date ? new Date(defaultValues.date).toISOString().split('T')[0] : new Date().toISOString().slice(0, 10);
      form.reset({
        kind: "out",
        amount: "",
        note: "",
        person: "",
        sourceAccount: "",
        destinationAccount: "",
        ...Object.fromEntries(
          Object.entries(defaultValues || {}).map(([k, v]) => [k, v === null ? "" : v])
        ),
        date: formattedDate, // Ensure date is formatted correctly
      });
    }
  }, [open, defaultValues?.id, form]); // Only reset when open status or the edited record ID changes

  const kind = form.watch("kind");
  const isPersonRequired = [
    "person_in",
    "person_out",
    "loan_given",
    "loan_taken",
    "fund_received",
    "settlement_in",
    "settlement_out",
  ].includes(kind);
  
  const showSource = [
    "out",
    "sub",
    "person_out",
    "loan_given",
    "settlement_out",
    "transfer"
  ].includes(kind);

  const showDest = [
    "in",
    "person_in",
    "loan_taken",
    "fund_received",
    "settlement_in",
    "transfer"
  ].includes(kind);

  const onSubmit = async (data: FormValues) => {
    console.log("[TransactionModal] onSubmit triggered:", data);
    try {
      const parsedDate = data.date ? new Date(data.date) : new Date();
      const payload = {
        ...data,
        amount: data.amount,
        date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      };
      
      console.log("[TransactionModal] Payload prepared:", payload);

      if (isPersonRequired && !data.person) {
        form.setError("person", { message: t("person") + " is required" });
        return;
      }

      if (!showSource && data.sourceAccount) payload.sourceAccount = "";
      if (!showDest && data.destinationAccount) payload.destinationAccount = "";

      if (isEdit && defaultValues.id) {
        await updateEntry.mutateAsync({ id: defaultValues.id, ...payload });
        toast.success(t("entity_updated"));
      } else {
        await addEntry.mutateAsync(payload);
        toast.success(t("entity_created"));
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t("failed_to_save"));
    }
  };

  const isPending = addEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4 md:p-5 gap-3">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{isEdit ? t("edit_transaction") : t("add_transaction")}</DialogTitle>
            <button 
              onClick={() => { onOpenChange(false); navigate("/docs"); }}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title={t("help_docs")}
            >
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("[TransactionModal] Validation errors:", errors);
              toast.error("Please fix form errors before saving.");
            })} 
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in">{t("income")}</SelectItem>
                      <SelectItem value="out">{t("expense")}</SelectItem>
                      <SelectItem value="person_in">{t("person_in")}</SelectItem>
                      <SelectItem value="person_out">{t("person_out")}</SelectItem>
                      <SelectItem value="loan_given">{t("loan_given")}</SelectItem>
                      <SelectItem value="loan_taken">{t("loan_taken")}</SelectItem>
                      <SelectItem value="settlement_in">{t("settlement_in")}</SelectItem>
                      <SelectItem value="settlement_out">{t("settlement_out")}</SelectItem>
                      <SelectItem value="transfer">{t("transfer")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")} ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("note")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPersonRequired && (
              <FormField
                control={form.control}
                name="person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("person")}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={personOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t("select_person")}
                        emptyText={t("no_results")}
                        customPrefix={t("use_custom")}
                        loading={isLoadingEntities}
                        allowCustom={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className={cn("grid gap-3", showSource && showDest ? "grid-cols-2" : "grid-cols-1")}>
              {showSource && (
                <FormField
                  control={form.control}
                  name="sourceAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("source_account")}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accountOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t("source_account")}
                          emptyText={t("no_results")}
                          customPrefix={t("use_custom")}
                          loading={isLoadingEntities}
                          allowCustom={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showDest && (
                <FormField
                  control={form.control}
                  name="destinationAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dest_account")}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accountOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t("dest_account")}
                          emptyText={t("no_results")}
                          customPrefix={t("use_custom")}
                          loading={isLoadingEntities}
                          allowCustom={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t("save_changes") : t("save_transaction")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
