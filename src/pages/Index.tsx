import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SummaryCards, QuickStats } from "@/components/dashboard/SummaryCards";
import { WalletGrid } from "@/components/dashboard/WalletGrid";
import { LendenLedger } from "@/components/dashboard/LendenLedger";
import { EntityExplorer } from "@/components/dashboard/EntityExplorer";
import { BajarComparisonChart, FuelEfficiencyChart } from "@/components/dashboard/Charts";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { t } = useSettings();
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('dashboard')}</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your Personal AI Assistant at a glance.</p>
          </div>
          <QuickStats />
        </div>

        <SummaryCards />

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-6 rounded-full bg-primary/60" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{t('accounts')}</h3>
              <p className="text-[11px] text-muted-foreground ml-2 hidden sm:block">({t('manage_wallets')})</p>
            </div>
            <WalletGrid />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-6 rounded-full bg-accent/60" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{t('lenden')}</h3>
                  <p className="text-[11px] text-muted-foreground ml-2 hidden sm:block">({t('lenden_desc')})</p>
                </div>
                <LendenLedger />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BajarComparisonChart />
                <FuelEfficiencyChart />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <RecentEntries />
              <EntityExplorer />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
