import { useEffect, useState } from "react";
import { incidentsApi, participantsApi, workersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye } from "lucide-react";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    participant_id: 0, reported_by_worker_id: 0, incident_date: "", incident_type: "",
    severity: "low", description: "", location: "", immediate_action: ""
  });

  const load = () => {
    setLoading(true);
    incidentsApi.list({ status: statusFilter || undefined }).then(setIncidents).finally(() => setLoading(false));
  };

  useEffect(() => { load(); participantsApi.list().then(setParticipants); workersApi.list().then(setWorkers); }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await incidentsApi.create({
      ...form,
      participant_id: form.participant_id || undefined,
      reported_by_worker_id: form.reported_by_worker_id || undefined
    });
    setDialogOpen(false);
    load();
  };

  const viewDetail = async (id: number) => {
    const data = await incidentsApi.get(id);
    setSelectedIncident(data);
    setDetailDialogOpen(true);
  };

  const updateStatus = async (id: number, status: string) => {
    await incidentsApi.update(id, { status });
    load();
    if (selectedIncident?.id === id) {
      const data = await incidentsApi.get(id);
      setSelectedIncident(data);
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Incident Management</h1>
          <p className="text-sm text-zinc-500">Log and manage incidents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Report Incident</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Report New Incident</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Participant (optional)</Label>
                <select value={form.participant_id} onChange={e => setForm({...form, participant_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value={0}>Select participant...</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <Label>Reported By (Worker)</Label>
                <select value={form.reported_by_worker_id} onChange={e => setForm({...form, reported_by_worker_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value={0}>Select worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Incident Date</Label><Input type="date" value={form.incident_date} onChange={e => setForm({...form, incident_date: e.target.value})} required /></div>
                <div>
                  <Label>Type</Label>
                  <select value={form.incident_type} onChange={e => setForm({...form, incident_type: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option value="">Select type...</option>
                    <option value="Injury">Injury</option>
                    <option value="Near Miss">Near Miss</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Medication Error">Medication Error</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Severity</Label>
                <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required rows={3} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              <div><Label>Immediate Action Taken</Label><Textarea value={form.immediate_action} onChange={e => setForm({...form, immediate_action: e.target.value})} rows={2} /></div>
              <Button type="submit" className="w-full">Submit Incident Report</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="reviewed">Reviewed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Participant</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : incidents.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">No incidents found</TableCell></TableRow>
              ) : incidents.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm">{i.incident_date}</TableCell>
                  <TableCell className="text-sm font-medium">{i.incident_type}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{i.participant_name || "N/A"}</TableCell>
                  <TableCell><Badge variant={severityBadge(i.severity)}>{i.severity}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewDetail(i.id)}><Eye className="h-4 w-4" /></Button>
                      {i.status === "reported" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(i.id, "under_investigation")}>Investigate</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Incident Details</DialogTitle></DialogHeader>
          {selectedIncident && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{selectedIncident.incident_date}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Type</span><span>{selectedIncident.incident_type}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Severity</span><Badge variant={severityBadge(selectedIncident.severity)}>{selectedIncident.severity}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><Badge variant="outline">{selectedIncident.status}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Participant</span><span>{selectedIncident.participant_name || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Location</span><span>{selectedIncident.location || "N/A"}</span></div>
              <div><p className="text-zinc-500 mb-1">Description</p><p className="border rounded p-2">{selectedIncident.description}</p></div>
              {selectedIncident.immediate_action && <div><p className="text-zinc-500 mb-1">Immediate Action</p><p className="border rounded p-2">{selectedIncident.immediate_action}</p></div>}
              {selectedIncident.investigation_notes && <div><p className="text-zinc-500 mb-1">Investigation Notes</p><p className="border rounded p-2">{selectedIncident.investigation_notes}</p></div>}
              {selectedIncident.corrective_action && <div><p className="text-zinc-500 mb-1">Corrective Action</p><p className="border rounded p-2">{selectedIncident.corrective_action}</p></div>}
              <div className="flex gap-2 pt-2">
                {selectedIncident.status === "reported" && <Button size="sm" onClick={() => updateStatus(selectedIncident.id, "under_investigation")}>Start Investigation</Button>}
                {selectedIncident.status === "under_investigation" && <Button size="sm" onClick={() => updateStatus(selectedIncident.id, "reviewed")}>Mark Reviewed</Button>}
                {selectedIncident.status === "reviewed" && <Button size="sm" onClick={() => updateStatus(selectedIncident.id, "closed")}>Close</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
