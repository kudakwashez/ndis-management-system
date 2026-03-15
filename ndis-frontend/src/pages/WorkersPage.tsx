import { useEffect, useState } from "react";
import { workersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Pencil } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", role: "support_worker",
    wwcc_number: "", wwcc_expiry: "", police_check_date: "", first_aid_expiry: "",
    ndis_screening_number: "", ndis_screening_expiry: ""
  });

  const load = () => {
    setLoading(true);
    workersApi.list({ search: search || undefined }).then(setWorkers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", role: "support_worker", wwcc_number: "", wwcc_expiry: "", police_check_date: "", first_aid_expiry: "", ndis_screening_number: "", ndis_screening_expiry: "" });
    setDialogOpen(true);
  };

  const openEdit = (w: any) => {
    setEditItem(w);
    setForm({
      first_name: w.first_name, last_name: w.last_name, email: w.email, phone: w.phone || "",
      role: w.role, wwcc_number: w.wwcc_number || "", wwcc_expiry: w.wwcc_expiry || "",
      police_check_date: w.police_check_date || "", first_aid_expiry: w.first_aid_expiry || "",
      ndis_screening_number: w.ndis_screening_number || "", ndis_screening_expiry: w.ndis_screening_expiry || ""
    });
    setDialogOpen(true);
  };

  const viewCerts = async (id: number) => {
    const data = await workersApi.certifications(id);
    setCertData(data);
    setCertDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      await workersApi.update(editItem.id, form);
    } else {
      await workersApi.create(form);
    }
    setDialogOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workers</h1>
          <p className="text-sm text-zinc-500">Manage support workers and compliance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Worker</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editItem ? "Edit Worker" : "Add Worker"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required /></div>
                <div><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={!!editItem} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div>
                  <Label>Role</Label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="support_worker">Support Worker</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="therapist">Therapist</option>
                  </select>
                </div>
              </div>
              <h3 className="font-semibold text-sm pt-2">Compliance Documents</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WWCC Number</Label><Input value={form.wwcc_number} onChange={e => setForm({...form, wwcc_number: e.target.value})} /></div>
                <div><Label>WWCC Expiry</Label><Input type="date" value={form.wwcc_expiry} onChange={e => setForm({...form, wwcc_expiry: e.target.value})} /></div>
              </div>
              <div><Label>Police Check Date</Label><Input type="date" value={form.police_check_date} onChange={e => setForm({...form, police_check_date: e.target.value})} /></div>
              <div><Label>First Aid Expiry</Label><Input type="date" value={form.first_aid_expiry} onChange={e => setForm({...form, first_aid_expiry: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>NDIS Screening #</Label><Input value={form.ndis_screening_number} onChange={e => setForm({...form, ndis_screening_number: e.target.value})} /></div>
                <div><Label>NDIS Screening Expiry</Label><Input type="date" value={form.ndis_screening_expiry} onChange={e => setForm({...form, ndis_screening_expiry: e.target.value})} /></div>
              </div>
              <Button type="submit" className="w-full">{editItem ? "Update" : "Create"} Worker</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} className="max-w-sm" />
        <Button variant="outline" onClick={load}><Search className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-500">Loading...</TableCell></TableRow>
              ) : workers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-500">No workers found</TableCell></TableRow>
              ) : workers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.first_name} {w.last_name}</TableCell>
                  <TableCell className="text-sm">{w.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm capitalize">{w.role?.replace("_", " ")}</TableCell>
                  <TableCell><Badge variant={w.status === "active" ? "default" : "secondary"}>{w.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewCerts(w.id)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certifications Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Certifications - {certData?.worker_name}</DialogTitle></DialogHeader>
          {certData?.certifications?.length > 0 ? (
            <div className="space-y-3">
              {certData.certifications.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{c.type}</p>
                    <p className="text-xs text-zinc-500">{c.number || c.date || ""} {c.expiry ? `Expires: ${c.expiry}` : ""}</p>
                  </div>
                  <Badge variant={c.status === "valid" || c.status === "completed" ? "default" : "destructive"}>{c.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm text-center py-4">No certifications recorded</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
