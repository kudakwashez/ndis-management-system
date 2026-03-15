import { useEffect, useState } from "react";
import { complaintsApi, participantsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye } from "lucide-react";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolveText, setResolveText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    participant_id: 0, complainant_name: "", complainant_contact: "", category: "",
    description: "", priority: "medium", assigned_to: ""
  });

  const load = () => {
    setLoading(true);
    complaintsApi.list({ status: statusFilter || undefined }).then(setComplaints).finally(() => setLoading(false));
  };

  useEffect(() => { load(); participantsApi.list().then(setParticipants); }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await complaintsApi.create({
      ...form,
      participant_id: form.participant_id || undefined
    });
    setDialogOpen(false);
    load();
  };

  const viewDetail = async (id: number) => {
    const data = await complaintsApi.get(id);
    setSelectedComplaint(data);
    setResolveText("");
    setDetailDialogOpen(true);
  };

  const resolveComplaint = async () => {
    if (!selectedComplaint) return;
    await complaintsApi.update(selectedComplaint.id, { status: "resolved", resolution: resolveText });
    load();
    setDetailDialogOpen(false);
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Complaints</h1>
          <p className="text-sm text-zinc-500">Track and resolve complaints</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Log Complaint</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log New Complaint</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Related Participant (optional)</Label>
                <select value={form.participant_id} onChange={e => setForm({...form, participant_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value={0}>None</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Complainant Name</Label><Input value={form.complainant_name} onChange={e => setForm({...form, complainant_name: e.target.value})} required /></div>
                <div><Label>Contact</Label><Input value={form.complainant_contact} onChange={e => setForm({...form, complainant_contact: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option value="">Select...</option>
                    <option value="Service Quality">Service Quality</option>
                    <option value="Staff Conduct">Staff Conduct</option>
                    <option value="Billing">Billing</option>
                    <option value="Communication">Communication</option>
                    <option value="Safety">Safety</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required rows={3} /></div>
              <div><Label>Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} placeholder="Manager name" /></div>
              <Button type="submit" className="w-full">Submit Complaint</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Participant</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : complaints.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">No complaints found</TableCell></TableRow>
              ) : complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{c.complaint_date}</TableCell>
                  <TableCell className="text-sm font-medium">{c.complainant_name}</TableCell>
                  <TableCell className="text-sm">{c.category}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{c.participant_name || "N/A"}</TableCell>
                  <TableCell><Badge variant={priorityBadge(c.priority)}>{c.priority}</Badge></TableCell>
                  <TableCell><Badge variant={c.status === "resolved" ? "default" : "outline"}>{c.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewDetail(c.id)}><Eye className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {selectedComplaint && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{selectedComplaint.complaint_date}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Complainant</span><span>{selectedComplaint.complainant_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Contact</span><span>{selectedComplaint.complainant_contact || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Category</span><span>{selectedComplaint.category}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Priority</span><Badge variant={priorityBadge(selectedComplaint.priority)}>{selectedComplaint.priority}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><Badge variant={selectedComplaint.status === "resolved" ? "default" : "outline"}>{selectedComplaint.status}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Assigned To</span><span>{selectedComplaint.assigned_to || "Unassigned"}</span></div>
              <div><p className="text-zinc-500 mb-1">Description</p><p className="border rounded p-2">{selectedComplaint.description}</p></div>
              {selectedComplaint.resolution && <div><p className="text-zinc-500 mb-1">Resolution</p><p className="border rounded p-2">{selectedComplaint.resolution}</p></div>}
              {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
                <div className="border-t pt-3 space-y-2">
                  <Label>Resolution</Label>
                  <Textarea value={resolveText} onChange={e => setResolveText(e.target.value)} placeholder="Describe the resolution..." rows={3} />
                  <Button onClick={resolveComplaint} className="w-full" disabled={!resolveText.trim()}>Resolve Complaint</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
