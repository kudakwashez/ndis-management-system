import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { participantsApi, agreementsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";

export default function ParticipantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agForm, setAgForm] = useState({ title: "", description: "", start_date: "", end_date: "", total_value: 0 });

  useEffect(() => {
    if (id) {
      participantsApi.get(Number(id)).then(setParticipant);
      participantsApi.budget(Number(id)).then(setBudget);
      agreementsApi.list(Number(id)).then(setAgreements);
    }
  }, [id]);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    await agreementsApi.create(Number(id), agForm);
    setDialogOpen(false);
    agreementsApi.list(Number(id)).then(setAgreements);
  };

  if (!participant) return <div className="text-center py-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/participants")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{participant.first_name} {participant.last_name}</h1>
          <p className="text-sm text-zinc-500">NDIS Number: {participant.ndis_number}</p>
        </div>
        <Badge className="ml-2" variant={participant.status === "active" ? "default" : "secondary"}>{participant.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Date of Birth</span><span>{participant.date_of_birth || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Phone</span><span>{participant.phone || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Email</span><span>{participant.email || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Address</span><span>{participant.address || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Plan Period</span><span>{participant.plan_start_date} to {participant.plan_end_date}</span></div>
          </CardContent>
        </Card>

        {/* Budget */}
        {budget && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Budget Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Core Supports</span><span>${budget.core_supports.used?.toLocaleString()} / ${budget.core_supports.budget?.toLocaleString()}</span></div>
                <div className="w-full bg-zinc-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(budget.core_supports.percentage_used, 100)}%` }} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">{budget.core_supports.percentage_used}% used</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Capacity Building</span><span>${budget.capacity_building.used?.toLocaleString()} / ${budget.capacity_building.budget?.toLocaleString()}</span></div>
                <div className="w-full bg-zinc-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(budget.capacity_building.percentage_used, 100)}%` }} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">{budget.capacity_building.percentage_used}% used</p>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm font-semibold"><span>Total</span><span>${budget.total_used?.toLocaleString()} / ${budget.total_budget?.toLocaleString()}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Agreements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Service Agreements</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Agreement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Service Agreement</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateAgreement} className="space-y-3">
                <div><Label>Title</Label><Input value={agForm.title} onChange={e => setAgForm({...agForm, title: e.target.value})} required /></div>
                <div><Label>Description</Label><Input value={agForm.description} onChange={e => setAgForm({...agForm, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={agForm.start_date} onChange={e => setAgForm({...agForm, start_date: e.target.value})} required /></div>
                  <div><Label>End Date</Label><Input type="date" value={agForm.end_date} onChange={e => setAgForm({...agForm, end_date: e.target.value})} required /></div>
                </div>
                <div><Label>Total Value ($)</Label><Input type="number" value={agForm.total_value} onChange={e => setAgForm({...agForm, total_value: Number(e.target.value)})} /></div>
                <Button type="submit" className="w-full">Create Agreement</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-4">No service agreements</p>
          ) : (
            <div className="space-y-3">
              {agreements.map(ag => (
                <div key={ag.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ag.title}</p>
                    <p className="text-xs text-zinc-500">{ag.start_date} to {ag.end_date} | ${ag.total_value?.toLocaleString()}</p>
                  </div>
                  <Badge variant={ag.status === "active" ? "default" : ag.status === "draft" ? "secondary" : "outline"}>{ag.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
