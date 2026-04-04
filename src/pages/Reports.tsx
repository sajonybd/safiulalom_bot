import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Download, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BajarComparisonChart, FuelEfficiencyChart } from "@/components/dashboard/Charts";
import { useSummary } from "@/hooks/useSummary";
import { useSettings } from "@/contexts/SettingsContext";

const Reports = () => {
  const { data, isLoading } = useSummary();
  const { t, currencySymbol } = useSettings();
  const s = data?.month || { income: 0, expense: 0, net: 0, counts: {} };
  const txThisMonth = Object.values(s.counts || {}).reduce((a: any, b: any) => a + b, 0);

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("reports")}</h2>
          <p className="text-sm text-muted-foreground">{t("analytics_desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" /> {t("this_month")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> {t("export")}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="py-10 flex justify-center text-primary">
           <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('income'), value: s.income, color: 'text-primary' },
            { label: t('expense'), value: Number(s.expense), color: 'text-destructive' },
            { label: t('net_savings'), value: Number(s.net), color: 'text-primary' },
            { label: t('transactions'), value: txThisMonth, color: 'text-foreground', isCurrency: false },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className={`text-xl font-bold font-mono ${metric.color}`}>
                {metric.isCurrency !== false ? `${currencySymbol}${Number(metric.value).toLocaleString()}` : String(metric.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BajarComparisonChart />
        <FuelEfficiencyChart />
      </div>

      {/* Monthly Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> {t("category_breakdown")}
        </h3>
        {isLoading ? (
          <div className="py-4 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : s.categories?.length > 0 ? (
          <div className="space-y-4">
            {s.categories.map((cat: any) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono">{currencySymbol}{Number(cat.total).toLocaleString()}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{cat.pct}%</Badge>
                  </div>
                </div>
                <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-primary rounded-full h-full transition-all duration-500" 
                    style={{ width: `${cat.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("no_data_available") || "No category data available yet"}</p>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default Reports;
