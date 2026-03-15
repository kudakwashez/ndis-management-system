import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, Calendar, AlertTriangle, DollarSign, MessageSquareWarning } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.summary().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-zinc-500">Loading dashboard...</p></div>;
  if (!data) return <div className="text-red-500">Failed to load dashboard</div>;

  const stats = [
    { label: "Total Participants", value: data.total_participants, icon: Users, color: "bg-blue-500" },
    { label: "Active Workers", value: data.active_workers, icon: UserCog, color: "bg-green-500" },
    { label: "Today's Services", value: data.today_services, icon: Calendar, color: "bg-purple-500" },
    { label: "Pending Claims", value: data.pending_claims, icon: DollarSign, color: "bg-amber-500" },
    { label: "Pending Incidents", value: data.pending_incidents, icon: AlertTriangle, color: "bg-red-500" },
    { label: "Open Complaints", value: data.open_complaints, icon: MessageSquareWarning, color: "bg-orange-500" },
  ];

  const chartData = [...(data.monthly_services || [])].reverse().map((m: any) => ({
    month: m.month,
    services: m.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Provider Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Overview of your NDIS provider operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${stat.color} rounded-lg p-2.5`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Budget</span>
                <span className="font-semibold">${data.total_budget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Used</span>
                <span className="font-semibold">${data.total_used?.toLocaleString()}</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(data.budget_utilization, 100)}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500">{data.budget_utilization}% utilized</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Services Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Services</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="services" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-zinc-400 text-sm text-center py-8">No service data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_incidents?.length > 0 ? (
              <div className="space-y-3">
                {data.recent_incidents.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{i.incident_type}</p>
                      <p className="text-xs text-zinc-500">{i.participant_name || "N/A"} - {i.incident_date}</p>
                    </div>
                    <Badge variant={i.severity === "high" ? "destructive" : i.severity === "medium" ? "default" : "secondary"}>
                      {i.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm text-center py-4">No incidents</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Claims</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_claims?.length > 0 ? (
              <div className="space-y-3">
                {data.recent_claims.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{c.claim_reference}</p>
                      <p className="text-xs text-zinc-500">{c.participant_name} - ${c.total_amount}</p>
                    </div>
                    <Badge variant={c.status === "paid" ? "default" : c.status === "submitted" ? "secondary" : "outline"}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm text-center py-4">No claims</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
