import { ArrowRightLeft, Settings, Loader2 } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useSettings } from "@/contexts/SettingsContext";

const walletGradients: Record<string, string> = {
  bkash: 'from-pink-600/20 to-pink-900/10',
  bank: 'from-blue-600/20 to-blue-900/10',
  cash: 'from-emerald-600/20 to-emerald-900/10',
  nagad: 'from-orange-600/20 to-orange-900/10',
};

const walletBorders: Record<string, string> = {
  bkash: 'border-pink-500/30',
  bank: 'border-blue-500/30',
  cash: 'border-emerald-500/30',
  nagad: 'border-orange-500/30',
};

export function WalletGrid() {
  const { data, isLoading } = useSummary();
  const { t, currencySymbol } = useSettings();
  const accounts = data?.accounts || [];

  const formatMoney = (n: number) => {
    return `${currencySymbol}${Number(n).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-lg border p-6 flex justify-center border-border">
             <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {accounts.map((w: any, i: number) => (
        <div
          key={w.account}
          className={`
            relative overflow-hidden rounded-lg border p-4
            bg-gradient-to-br ${walletGradients[w.account.toLowerCase()] || ''} ${walletBorders[w.account.toLowerCase()] || 'border-border'}
            hover:scale-[1.02] transition-all duration-200 cursor-pointer group
          `}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">🏦</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase">{t('active_account')}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 capitalize">{w.account}</p>
          <p className="text-lg font-bold font-mono tracking-tight text-foreground">
            {formatMoney(w.balance)}
          </p>
          <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ArrowRightLeft className="w-3 h-3" /> {t('transfer_btn')}
            </button>
            <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Settings className="w-3 h-3" /> {t('adjust')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
