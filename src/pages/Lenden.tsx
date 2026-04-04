import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ArrowDownRight, ArrowUpRight, Search, Filter, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePeople } from "@/hooks/usePeople";
import { useTeam } from "@/hooks/useTeam";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Lenden page translates to "Transactions/Exchange" in Bengali.
 * This page manages debt, loans, and settlements (receivables/payables).
 */
const Lenden = () => {
  const { data, isLoading } = usePeople();
  const { data: teamData } = useTeam();
  const { t, currencySymbol } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"settlement_in" | "settlement_out" | "loan_given" | "loan_taken">("loan_given");

  const activeFamilyId = teamData?.activeFamilyId;
  const currentTeam = teamData?.myFamilies?.find((f: any) => String(f.family_id) === String(activeFamilyId));
  const myRole = currentTeam?.role || 'VIEWER';

  const peopleBalances: any[] = data?.people || [];

  const totalReceivable = peopleBalances.reduce((s, p) => s + Number(p.receivable), 0);
  const totalPayable = peopleBalances.reduce((s, p) => s + Number(p.payable), 0);

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("lenden")}</h2>
          <p className="text-sm text-muted-foreground">{t("lenden_desc")}</p>
        </div>
        {myRole !== 'VIEWER' && (
          <Button size="sm" className="gap-1.5" onClick={() => { setModalType("loan_given"); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> {t("add_loan_debt")}
          </Button>
        )}
      </div>

      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} defaultValues={{ kind: modalType }} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-primary" />{t("receivable")}</div>
          <p className="text-2xl font-bold font-mono text-primary">{currencySymbol}{totalReceivable.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />{t("payable")}
          </div>
          <p className="text-2xl font-bold font-mono text-destructive">{currencySymbol}{totalPayable.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{t("net_position")}</div>
          <p className={`text-2xl font-bold font-mono ${totalReceivable - totalPayable >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {currencySymbol}{Math.abs(totalReceivable - totalPayable).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("search_placeholder")} className="pl-9 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5" /> {t("filter")}
        </Button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t("person")}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t("relation")}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{t("receivable")}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{t("payable")}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{t("net")}</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td>
              </tr>
            ) : peopleBalances.map((person: any) => (
              <tr key={person.person_key} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {person.person[0]}
                    </div>
                    <span className="font-medium text-foreground">{person.person}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs capitalize">{person.count} {t("entries")}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-primary">
                  {Number(person.receivable) > 0 ? `${currencySymbol}${Number(person.receivable).toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-destructive">
                  {Number(person.payable) > 0 ? `${currencySymbol}${Number(person.payable).toLocaleString()}` : '-'}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${Number(person.net) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {currencySymbol}{Math.abs(Number(person.net)).toLocaleString()}
                </td>
                 <td className="px-4 py-3 text-center">
                    {myRole !== 'VIEWER' && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                        setModalType(Number(person.net) >= 0 ? "settlement_in" : "settlement_out");
                        setModalOpen(true);
                      }}>
                        {t("settle")}
                      </Button>
                    )}
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default Lenden;
