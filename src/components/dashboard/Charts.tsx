import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3, Fuel } from "lucide-react";
import { useLedger } from "@/hooks/useLedger";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(220, 18%, 10%)',
    border: '1px solid hsl(220, 14%, 18%)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'hsl(210, 20%, 92%)',
  },
  labelStyle: { color: 'hsl(215, 12%, 50%)' },
};

export function BajarComparisonChart() {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Monthly Bajar Comparison</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Chart data requires dedicated API
        </div>
      </ResponsiveContainer>
    </div>
  );
}

export function FuelEfficiencyChart() {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Bike Fuel Efficiency (KM/L)</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Chart data requires dedicated API
        </div>
      </ResponsiveContainer>
    </div>
  );
}
