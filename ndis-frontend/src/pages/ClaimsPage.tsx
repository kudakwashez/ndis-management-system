import { useEffect, useState } from "react";
import { claimsApi, participantsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, Clock, CheckCircle, Send } from "lucide-react";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    participant_id: 0, support_category: "", item_number: "", description: "", quantity: 1, unit_price: 0
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      claimsApi.list({ status: statusFilter || undefined }),
      claimsApi.summary()
    ]).then(([c, s]) => { setClaims(c); setSummary(s); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); participantsApi.list().then(setParticipants); }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await claimsApi.create(form);
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await claimsApi.update(id, { status });
    load();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "submitted": return "default";
      case "paid": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Claims & Billing</h1>
          <p className="text-sm text-zinc-500">Generate and manage NDIS claims</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Claim</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Claim</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Participant</Label>
                <select value={form.participant_id} onChange={e => setForm({...form, participant_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                  <option value={0}>Select participant...</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <Label>Support Category</Label>
                <select value={form.support_category} onChange={e => setForm({...form, support_category: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" required>
                  <option value="">Select category...</option>
                  <option value="Core Supports">Core Supports</option>
                  <option value="Capacity Building">Capacity Building</option>
                  <option value="Capital Supports">Capital Supports</option>
                </select>
              </div>
              <div><Label>Item Number</Label><Input value={form.item_number} onChange={e => setForm({...form, item_number: e.target.value})} placeholder="e.g. 01_011_0107_1_1" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" step="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
                <div><Label>Unit Price ($)</Label><Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: Number(e.target.value)})} /></div>
              </div>
              <p className="text-sm text-zinc-500">Total: ${(form.quantity * form.unit_price).toFixed(2)}</p>
              <Button type="submit" className="w-full">Create Claim</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-zinc-100 rounded-lg p-2"><DollarSign className="h-5 w-5 text-zinc-600" /></div>
              <div><p className="text-xs text-zinc-500">Total Claims</p><p className="text-lg font-bold">${summary.total.amount?.toLocaleString()}</p><p className="text-xs text-zinc-400">{summary.total.count} claims</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-amber-50 rounded-lg p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-xs text-zinc-500">Pending</p><p className="text-lg font-bold">${summary.pending.amount?.toLocaleString()}</p><p className="text-xs text-zinc-400">{summary.pending.count} claims</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-50 rounded-lg p-2"><Send className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-zinc-500">Submitted</p><p className="text-lg font-bold">${summary.submitted.amount?.toLocaleString()}</p><p className="text-xs text-zinc-400">{summary.submitted.count} claims</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-50 rounded-lg p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-zinc-500">Paid</p><p className="text-lg font-bold">${summary.paid.amount?.toLocaleString()}</p><p className="text-xs text-zinc-400">{summary.paid.count} claims</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : claims.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">No claims found</TableCell></TableRow>
              ) : claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.claim_reference}</TableCell>
                  <TableCell className="text-sm">{c.participant_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{c.support_category}</TableCell>
                  <TableCell className="font-medium">${c.total_amount?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusBadge(c.status)}>{c.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "submitted")}>Submit</Button>
                      )}
                      {c.status === "submitted" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "paid")}>Mark Paid</Button>
                      )}
                    </div>
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
