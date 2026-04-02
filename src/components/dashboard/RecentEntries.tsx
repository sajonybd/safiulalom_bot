import { ArrowDownLeft, ArrowUpRight, Repeat, Clock, Loader2 } from "lucide-react";
import { useLedger } from "@/hooks/useLedger";
import { useSettings } from "@/contexts/SettingsContext";

export function RecentEntries() {
  const { data, isLoading } = useLedger();
  const { t, currencySymbol } = useSettings();

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
          entries.slice(0, 10).map((entry: any) => {
            const config = kindConfig[entry.kind] || { icon: ArrowUpRight, color: 'text-foreground', label: entry.kind };
            const Icon = config.icon;
            const isInflow = ['in', 'person_in', 'settlement_in', 'loan_taken', 'fund_received'].includes(entry.kind);
            
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-secondary ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate font-medium">{entry.note || config.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {entry.person && ` · ${entry.person}`}
                  </p>
                </div>
                <p className={`text-xs font-mono font-semibold ${isInflow ? 'text-primary' : 'text-foreground'}`}>
                  {isInflow ? '+' : '-'}{currencySymbol}{Number(entry.amount).toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
