import { TrendingUp, TrendingDown, Wallet, ArrowUpDown, AlertCircle, Activity, Loader2 } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useSettings } from "@/contexts/SettingsContext";

export function SummaryCards() {
  const { data, isLoading } = useSummary();
  const { t, currencySymbol } = useSettings();

  const formatMoney = (n: number = 0) => {
    return `${currencySymbol}${n.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-lg p-4 flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  const s = data?.month || { income: 0, expense: 0, net: 0 };
  const accounts = data?.accounts || [];
  const totalBalance = accounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0);

  const cards = [
    { label: t('total_balance'), value: totalBalance, icon: Wallet, positive: true },
    { label: `${t('income')} (${t('month')})`, value: Number(s.income), icon: TrendingUp, positive: true },
    { label: `${t('expense')} (${t('month')})`, value: Number(s.expense), icon: TrendingDown, positive: false },
    { label: `${t('net')} (${t('month')})`, value: Number(s.net), icon: ArrowUpDown, positive: Number(s.net) > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="glass rounded-lg p-4 animate-slide-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`w-4 h-4 ${c.positive ? 'text-primary' : 'text-destructive'}`} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <p className={`text-xl font-bold font-mono ${c.positive ? 'text-primary' : 'text-destructive'}`}>
            {formatMoney(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function QuickStats() {
  const { data } = useSummary();
  const { t } = useSettings();
  const txCount = data?.month?.counts ? 
    Object.values(data.month.counts).reduce((a: any, b: any) => a + b, 0) : 0;

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" />
        <span>{String(txCount)} {t('month_transactions')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-accent">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>0 {t('pending')}</span>
      </div>
    </div>
  );
}
