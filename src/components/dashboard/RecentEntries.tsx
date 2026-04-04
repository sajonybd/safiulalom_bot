import { ArrowDownLeft, ArrowUpRight, Repeat, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { useLedger, useDeleteEntry } from "@/hooks/useLedger";
import { useSettings } from "@/contexts/SettingsContext";
import { useState } from "react";
import { TransactionModal } from "./TransactionModal";
import { toast } from "sonner";
import { ConfirmModal } from "./ConfirmModal";

export function RecentEntries() {
  const { data, isLoading } = useLedger();
  const { t, currencySymbol } = useSettings();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteMutation = useDeleteEntry();

  const kindConfig: Record<string, { icon: any; color: string; label: string }> = {
    in: { icon: ArrowDownLeft, color: 'text-primary', label: t('income') },
    out: { icon: ArrowUpRight, color: 'text-destructive', label: t('expense') },
    sub: { icon: Repeat, color: 'text-accent', label: t('subscription') },
    person_out: { icon: ArrowUpRight, color: 'text-accent', label: t('person_out') },
    person_in: { icon: ArrowDownLeft, color: 'text-primary', label: t('person_in') },
    loan_given: { icon: ArrowUpRight, color: 'text-accent', label: t('loan_given') },
    loan_taken: { icon: ArrowDownLeft, color: 'text-primary', label: t('loan_taken') },
    settlement_in: { icon: ArrowDownLeft, color: 'text-primary', label: t('settlement_in') },
    settlement_out: { icon: ArrowUpRight, color: 'text-accent', label: t('settlement_out') },
  };

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entries = data?.entries || [];
  
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success(t("delete_success") || "Transaction deleted");
    } catch (err) {
      toast.error("Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{t('recent_transactions')}</h3>
      </div>
      <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">{t('no_recent_activity')}</div>
        ) : (
          entries.slice(0, 15).map((entry: any) => {
            const config = kindConfig[entry.kind] || { icon: ArrowUpRight, color: 'text-foreground', label: entry.kind };
            const Icon = config.icon;
            const isInflow = ['in', 'person_in', 'settlement_in', 'loan_taken', 'fund_received'].includes(entry.kind);

            return (
              <div key={entry.id} className="relative group">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-all duration-300 border-l-2 border-transparent hover:border-primary/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-secondary/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-white/10 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate font-semibold tracking-tight">{entry.note || config.label}</p>
                    {entry.metadata?.items && entry.metadata.items.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.metadata.items.map((item: any, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-[9px] text-accent-foreground font-medium">
                            {item.name} {item.price ? `(${currencySymbol}${item.price})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="opacity-70">{new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      {entry.person && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="font-medium text-accent truncate">{entry.person}</span>
                        </>
                      )}
                      {(entry.source_account || entry.destination_account) && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="font-medium text-primary/80 truncate">
                            {entry.kind === 'transfer' 
                              ? `${entry.source_account || '?'} → ${entry.destination_account || '?'}`
                              : `${isInflow ? (entry.destination_account || entry.source_account) : (entry.source_account || entry.destination_account)}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className={`text-xs font-mono font-bold ${isInflow ? 'text-primary' : 'text-foreground'}`}>
                      {isInflow ? '+' : '-'}{currencySymbol}{Number(entry.amount).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 translate-x-1 opacity-70 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setEditingEntry(entry)}
                        className="p-1.5 hover:bg-primary/15 hover:text-primary rounded-md text-muted-foreground transition-all duration-200"
                        title={t('edit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingId(entry.id);
                          setIsConfirmOpen(true);
                        }}
                        className="p-1.5 hover:bg-destructive/15 hover:text-destructive rounded-md text-muted-foreground transition-all duration-200"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {editingEntry && (
        <TransactionModal
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          defaultValues={{
            id: editingEntry.id,
            kind: editingEntry.kind,
            amount: editingEntry.amount.toString(),
            note: editingEntry.note,
            person: editingEntry.person,
            date: editingEntry.created_at,
            sourceAccount: editingEntry.source_account,
            destinationAccount: editingEntry.destination_account,
          }}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        title={t("delete_transaction") || "Delete Transaction"}
        description={t("delete_confirm_generic") || "Are you sure you want to delete this transaction? This cannot be undone."}
        confirmText={t("delete")}
      />
    </div>
  );
}
