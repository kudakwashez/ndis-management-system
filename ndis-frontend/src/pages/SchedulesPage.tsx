import { useEffect, useState } from "react";
import { schedulesApi, participantsApi, workersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    participant_id: 0, worker_id: 0, service_type: "", scheduled_date: "", start_time: "", end_time: "", notes: ""
  });

  const load = () => {
    setLoading(true);
    schedulesApi.list().then(setSchedules).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    participantsApi.list().then(setParticipants);
    workersApi.list().then(setWorkers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await schedulesApi.create(form);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this schedule?")) {
      await schedulesApi.delete(id);
      load();
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "secondary";
      case "in_progress": return "default";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Scheduling & Rostering</h1>
          <p className="text-sm text-zinc-500">Manage service schedules and worker assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm({ participant_id: 0, worker_id: 0, service_type: "", scheduled_date: "", start_time: "", end_time: "", notes: "" }); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Schedule Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule New Service</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Participant</Label>
                <select value={form.participant_id} onChange={e => setForm({...form, participant_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                  <option value={0}>Select participant...</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <Label>Worker</Label>
                <select value={form.worker_id} onChange={e => setForm({...form, worker_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                  <option value={0}>Select worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
                </select>
              </div>
              <div>
                <Label>Service Type</Label>
                <select value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                  <option value="">Select type...</option>
                  <option value="Community Access">Community Access</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Therapy Session">Therapy Session</option>
                  <option value="Transport">Transport</option>
                  <option value="Group Activity">Group Activity</option>
                  <option value="Domestic Assistance">Domestic Assistance</option>
                </select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required /></div>
                <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full">Create Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead className="hidden md:table-cell">Worker</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : schedules.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">No schedules found</TableCell></TableRow>
              ) : schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.scheduled_date}</TableCell>
                  <TableCell className="text-sm">{s.start_time} - {s.end_time}</TableCell>
                  <TableCell className="font-medium text-sm">{s.participant_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.worker_name}</TableCell>
                  <TableCell className="text-sm">{s.service_type}</TableCell>
                  <TableCell><Badge variant={statusColor(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} disabled={s.status === "completed"}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
