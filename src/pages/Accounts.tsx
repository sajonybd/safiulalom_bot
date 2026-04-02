import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Plus, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSummary } from "@/hooks/useSummary";
import { useLedger } from "@/hooks/useLedger";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2 } from "lucide-react";

const Accounts = () => {
  const { data: summaryData, isLoading: summaryLoading } = useSummary();
  const { data: ledgerData, isLoading: ledgerLoading } = useLedger();
  const { t, currencySymbol } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"transfer" | "in" | "out">("in");

  const accounts = summaryData?.accounts || [];
  const recentEntries = ledgerData?.entries || [];
  const totalBalance = accounts.reduce((s: number, w: any) => s + w.balance, 0);

  const handleOpenModal = (type: "transfer" | "in" | "out", account?: string) => {
    setModalType(type);
    setModalOpen(true);
    // In a real app we might pass defaultValues down with the pre-filled account
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("accounts")}</h2>
            <p className="text-sm text-muted-foreground">{t("manage_wallets")}</p>
          </div>
        </div>

        <TransactionModal open={modalOpen} onOpenChange={setModalOpen} defaultValues={{ kind: modalType }} />

        {/* Total Balance */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("total_balance")}</p>
          {summaryLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mt-2 text-muted-foreground" />
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground font-mono">{currencySymbol}{totalBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("across_accounts").replace("{count}", accounts.length.toString())}</p>
            </>
          )}
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaryLoading ? (
            <div className="col-span-full py-10 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : accounts.map((wallet: any) => (
            <div key={wallet.account} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏦</span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground capitalize">{wallet.account}</h4>
                    <p className="text-xs text-muted-foreground">{t("active_account")}</p>
                  </div>
                </div>
                <p className="text-lg font-bold font-mono text-foreground">{currencySymbol}{wallet.balance.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleOpenModal("transfer")}>
                  <ArrowUpDown className="w-3 h-3" /> {t("transfer_btn")}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleOpenModal("in")}>
                  <TrendingUp className="w-3 h-3" /> {t("add_money")}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleOpenModal("out")}>
                  <TrendingDown className="w-3 h-3" /> {t("withdraw")}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("recent_transactions")}</h3>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {ledgerLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentEntries.slice(0, 6).map((entry: any) => {
               const isInflow = ["in", "fund_received", "loan_taken", "settlement_in", "person_in"].includes(entry.kind);
               return (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isInflow ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {isInflow ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{entry.note}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${
                    isInflow ? 'text-primary' : 'text-foreground'
                  }`}>
                    {isInflow ? '+' : '-'}৳{entry.amount.toLocaleString()}
                  </span>
                </div>
               );
             })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
