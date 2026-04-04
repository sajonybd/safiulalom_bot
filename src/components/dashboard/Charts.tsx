import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, Fuel, Loader2 } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(220, 18%, 10%)',
    border: '1px solid hsl(220, 14%, 18%)',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'hsl(210, 20%, 92%)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  itemStyle: { padding: '2px 0' },
  labelStyle: { color: 'hsl(215, 12@, 50%)', marginBottom: '4px', fontWeight: 600 },
};

export function BajarComparisonChart() {
  const { data, isLoading } = useSummary();
  const chartData = data?.charts?.bajar || [];

  return (
    <div className="glass rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground/90">Monthly Bazar</h3>
      </div>
      
      <div className="h-[200px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 14%, 18%, 0.5)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 11 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 11 }}
              />
              <Tooltip {...chartTooltipStyle} cursor={{ fill: 'hsla(220, 14%, 18%, 0.3)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={24}>
                {chartData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsla(var(--primary), 0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

export function FuelEfficiencyChart() {
  const { data, isLoading } = useSummary();
  const chartData = data?.charts?.fuel || [];

  return (
    <div className="glass rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-accent/10">
          <Fuel className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-sm font-semibold text-foreground/90">Fuel Efficiency (KM/L)</h3>
      </div>
      
      <div className="h-[200px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 14%, 18%, 0.5)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 11 }}
              />
              <Tooltip {...chartTooltipStyle} />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No odometer data found
          </div>
        )}
      </div>
    </div>
  );
}
