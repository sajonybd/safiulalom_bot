import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SummaryCards, QuickStats } from "@/components/dashboard/SummaryCards";
import { WalletGrid } from "@/components/dashboard/WalletGrid";
import { LendenLedger } from "@/components/dashboard/LendenLedger";
import { PendingInbox } from "@/components/dashboard/PendingInbox";
import { EntityExplorer } from "@/components/dashboard/EntityExplorer";
import { BajarComparisonChart, FuelEfficiencyChart } from "@/components/dashboard/Charts";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { t } = useSettings();
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('dashboard')}</h2>
          <QuickStats />
        </div>
        <SummaryCards />
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('wallets')}</h3>
          <WalletGrid />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <PendingInbox />
            <LendenLedger />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <BajarComparisonChart />
              <FuelEfficiencyChart />
            </div>
          </div>
          <div className="space-y-5">
            <RecentEntries />
            <EntityExplorer />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
