import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui";
import { SHIPMENT_STATUS } from "@/constants";

const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 10px 30px rgba(15,23,42,.08)" };

/** @param {{ data: {date:string,onTime:number,late:number}[], onTimeRate: number }} props */
export function DeliveryTrendChart({ data, onTimeRate }) {
  const total = data.reduce((s, d) => s + d.onTime + d.late, 0);
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Delivery performance"
        subtitle="Completed deliveries over the last 14 days"
        action={
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> On time
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Late
            </span>
          </div>
        }
      />
      <div className="flex flex-wrap gap-6 px-5 pt-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">Deliveries</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{onTimeRate}%</p>
          <p className="text-xs text-slate-500">On-time rate</p>
        </div>
      </div>
      <div className="h-64 px-2 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gOnTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="onTime" name="On time" stroke="#6366f1" strokeWidth={2.5} fill="url(#gOnTime)" />
            <Area type="monotone" dataKey="late" name="Late" stroke="#fb7185" strokeWidth={2} fill="url(#gLate)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ShipmentStatusChart({ counts }) {
  const data = [
    { name: "Delivered", value: counts.delivered, color: SHIPMENT_STATUS.delivered.color },
    { name: "In transit", value: counts.inTransit, color: SHIPMENT_STATUS["in-transit"].color },
    { name: "Delayed", value: counts.delayed, color: SHIPMENT_STATUS.delayed.color },
    { name: "Pending", value: counts.pending, color: SHIPMENT_STATUS.assigned.color },
    { name: "Cancelled", value: counts.cancelled, color: "#cbd5e1" },
  ].filter((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader title="Shipment status" subtitle="Distribution across all shipments" />
      <div className="relative mx-auto h-52 w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 px-5 pb-5 pt-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-semibold text-slate-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
