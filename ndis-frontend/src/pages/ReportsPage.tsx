import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportsPage() {
  const [compliance, setCompliance] = useState<any>(null);
  const [services, setServices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.complianceReport(),
      dashboardApi.serviceReport()
    ]).then(([c, s]) => {
      setCompliance(c);
      setServices(s);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-zinc-500">Loading reports...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Compliance</h1>
        <p className="text-sm text-zinc-500">Compliance dashboards and operational reports</p>
      </div>

      <Tabs defaultValue="compliance">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="mt-4 space-y-6">
          {compliance && (
            <>
              {/* Worker Compliance */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Worker Compliance</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{compliance.worker_compliance.total_workers}</p>
                      <p className="text-xs text-zinc-500">Total Workers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{compliance.worker_compliance.wwcc}</p>
                      <p className="text-xs text-zinc-500">WWCC</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{compliance.worker_compliance.police_check}</p>
                      <p className="text-xs text-zinc-500">Police Check</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{compliance.worker_compliance.first_aid}</p>
                      <p className="text-xs text-zinc-500">First Aid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{compliance.worker_compliance.ndis_screening}</p>
                      <p className="text-xs text-zinc-500">NDIS Screening</p>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: `${compliance.worker_compliance.compliance_rate}%` }} />
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">{compliance.worker_compliance.compliance_rate}% overall compliance rate</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incidents by Type */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Incidents by Type</CardTitle></CardHeader>
                  <CardContent>
                    {compliance.incidents.by_type.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={compliance.incidents.by_type}>
                          <XAxis dataKey="incident_type" fontSize={11} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No incident data</p>}
                  </CardContent>
                </Card>

                {/* Incidents by Severity */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Incidents by Severity</CardTitle></CardHeader>
                  <CardContent>
                    {compliance.incidents.by_severity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={compliance.incidents.by_severity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={80} label>
                            {compliance.incidents.by_severity.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No incident data</p>}
                  </CardContent>
                </Card>

                {/* Complaints by Category */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Complaints by Category</CardTitle></CardHeader>
                  <CardContent>
                    {compliance.complaints.by_category.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={compliance.complaints.by_category}>
                          <XAxis dataKey="category" fontSize={11} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No complaint data</p>}
                  </CardContent>
                </Card>

                {/* Complaints by Status */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Complaints by Status</CardTitle></CardHeader>
                  <CardContent>
                    {compliance.complaints.by_status.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={compliance.complaints.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                            {compliance.complaints.by_status.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No complaint data</p>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-6">
          {services && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{services.total_services}</p>
                    <p className="text-sm text-zinc-500">Total Services</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{services.completed_services}</p>
                    <p className="text-sm text-zinc-500">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{services.total_hours}h</p>
                    <p className="text-sm text-zinc-500">Total Hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{services.completion_rate}%</p>
                    <p className="text-sm text-zinc-500">Completion Rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Services by Type</CardTitle></CardHeader>
                  <CardContent>
                    {services.services_by_type.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={services.services_by_type}>
                          <XAxis dataKey="service_type" fontSize={11} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No service data</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Top Workers</CardTitle></CardHeader>
                  <CardContent>
                    {services.top_workers.length > 0 ? (
                      <div className="space-y-3">
                        {services.top_workers.map((w: any, i: number) => (
                          <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                              <p className="text-sm font-medium">{w.worker_name}</p>
                              <p className="text-xs text-zinc-500">{w.total_hours}h total</p>
                            </div>
                            <Badge>{w.service_count} services</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-zinc-400 text-sm text-center py-8">No worker data</p>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
