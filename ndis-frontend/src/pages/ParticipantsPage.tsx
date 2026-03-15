import { useEffect, useState } from "react";
import { participantsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "", last_name: "", ndis_number: "", date_of_birth: "",
    phone: "", email: "", address: "", plan_start_date: "", plan_end_date: "",
    core_supports_budget: 0, capacity_building_budget: 0, notes: ""
  });

  const load = () => {
    setLoading(true);
    participantsApi.list({ search: search || undefined }).then(setParticipants).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load();

  const openCreate = () => {
    setEditItem(null);
    setForm({ first_name: "", last_name: "", ndis_number: "", date_of_birth: "", phone: "", email: "", address: "", plan_start_date: "", plan_end_date: "", core_supports_budget: 0, capacity_building_budget: 0, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditItem(p);
    setForm({
      first_name: p.first_name, last_name: p.last_name, ndis_number: p.ndis_number,
      date_of_birth: p.date_of_birth || "", phone: p.phone || "", email: p.email || "",
      address: p.address || "", plan_start_date: p.plan_start_date || "",
      plan_end_date: p.plan_end_date || "", core_supports_budget: p.core_supports_budget,
      capacity_building_budget: p.capacity_building_budget, notes: p.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      await participantsApi.update(editItem.id, form);
    } else {
      await participantsApi.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this participant?")) {
      await participantsApi.delete(id);
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-sm text-zinc-500">Manage NDIS participant records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Participant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Participant" : "Add Participant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required /></div>
                <div><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required /></div>
              </div>
              <div><Label>NDIS Number</Label><Input value={form.ndis_number} onChange={e => setForm({...form, ndis_number: e.target.value})} required disabled={!!editItem} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Plan Start</Label><Input type="date" value={form.plan_start_date} onChange={e => setForm({...form, plan_start_date: e.target.value})} /></div>
                <div><Label>Plan End</Label><Input type="date" value={form.plan_end_date} onChange={e => setForm({...form, plan_end_date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Core Supports Budget ($)</Label><Input type="number" value={form.core_supports_budget} onChange={e => setForm({...form, core_supports_budget: Number(e.target.value)})} /></div>
                <div><Label>Capacity Building Budget ($)</Label><Input type="number" value={form.capacity_building_budget} onChange={e => setForm({...form, capacity_building_budget: Number(e.target.value)})} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full">{editItem ? "Update" : "Create"} Participant</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search by name or NDIS number..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="max-w-sm" />
        <Button variant="outline" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NDIS Number</TableHead>
                <TableHead className="hidden md:table-cell">Plan Dates</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : participants.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">No participants found</TableCell></TableRow>
              ) : participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                  <TableCell>{p.ndis_number}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-zinc-500">{p.plan_start_date} - {p.plan_end_date}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">${(p.core_supports_budget + p.capacity_building_budget)?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/participants/${p.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
