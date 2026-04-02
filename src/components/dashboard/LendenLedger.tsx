import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, HandCoins, Loader2 } from "lucide-react";
import { usePeople } from "@/hooks/usePeople";
import { useSettings } from "@/contexts/SettingsContext";
import { TransactionModal } from "@/components/dashboard/TransactionModal";

export function LendenLedger() {
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [settlingPerson, setSettlingPerson] = useState<any>(null);
  
  const { data, isLoading } = usePeople();
  const { t, currencySymbol } = useSettings();
  const peopleBalances: any[] = data?.people || [];

  const formatMoney = (n: number) => {
    return `${currencySymbol}${Math.abs(Number(n)).toLocaleString()}`;
  };

  const receivableTotal = peopleBalances.reduce((s, p) => s + Number(p.receivable), 0);
  const payableTotal = peopleBalances.reduce((s, p) => s + Number(p.payable), 0);

  const filtered = peopleBalances.filter(p => {
    if (filter === 'receivable') return p.net > 0;
    if (filter === 'payable') return p.net < 0;
    return true;
  });

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-accent" />
              {t('lenden')}
            </h3>
            <div className="flex gap-1">
              {(['all', 'receivable', 'payable'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-full transition-colors capitalize ${
                    filter === f
                      ? f === 'receivable' ? 'bg-primary/20 text-primary' : f === 'payable' ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(f)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">{t('receivable')}:</span>
              <span className="text-xs font-mono font-semibold text-primary">{formatMoney(receivableTotal)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">{t('payable')}:</span>
              <span className="text-xs font-mono font-semibold text-destructive">{formatMoney(payableTotal)}</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              No records found
            </div>
          ) : filtered.map((p) => (
            <div key={p.person_key} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  p.net > 0 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                }`}>
                  {p.net > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.person}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{p.count} entries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-sm font-mono font-semibold ${p.net > 0 ? 'text-primary' : 'text-destructive'}`}>
                  {p.net > 0 ? '+' : '-'}{formatMoney(p.net)}
                </p>
                <button
                  onClick={() => setSettlingPerson(p)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
                >
                  {t('settle')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {settlingPerson && (
        <TransactionModal 
          open={!!settlingPerson} 
          onOpenChange={(op) => !op && setSettlingPerson(null)} 
          defaultValues={{
            kind: settlingPerson.net > 0 ? "settlement_in" : "settlement_out",
            person: settlingPerson.person,
            amount: Math.abs(Number(settlingPerson.net)).toString(),
          }}
        />
      )}
    </>
  );
}
