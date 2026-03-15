import { useEffect, useState } from "react";
import { servicesApi, schedulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LogIn, LogOut, FileText, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("progress");

  const loadServices = () => {
    setLoading(true);
    Promise.all([
      servicesApi.list(),
      schedulesApi.today()
    ]).then(([svc, today]) => {
      setServices(svc);
      setTodaySchedules(today);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadServices(); }, []);

  const handleCheckIn = async (scheduleId: number) => {
    await servicesApi.checkIn(scheduleId);
    loadServices();
  };

  const handleCheckOut = async (scheduleId: number) => {
    const notesText = prompt("Any notes for this service?") || "";
    await servicesApi.checkOut(scheduleId, { notes: notesText });
    loadServices();
  };

  const openNotes = async (serviceId: number) => {
    setSelectedService(serviceId);
    const data = await servicesApi.notes(serviceId);
    setNotes(data);
    setNotesDialogOpen(true);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedService) return;
    await servicesApi.addNote(selectedService, { note_text: newNote, note_type: noteType });
    const data = await servicesApi.notes(selectedService);
    setNotes(data);
    setNewNote("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Service Delivery</h1>
        <p className="text-sm text-zinc-500">Check in/out and manage service records</p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="records">Service Records</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Today's Services</CardTitle></CardHeader>
            <CardContent>
              {todaySchedules.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-8">No services scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map((s) => (
                    <div key={s.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{s.participant_name}</p>
                        <p className="text-sm text-zinc-500">{s.service_type} | {s.start_time} - {s.end_time}</p>
                        <p className="text-sm text-zinc-500">Worker: {s.worker_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.status === "completed" ? "default" : s.status === "in_progress" ? "default" : "secondary"}>
                          {s.status}
                        </Badge>
                        {s.status === "scheduled" && (
                          <Button size="sm" onClick={() => handleCheckIn(s.id)}>
                            <LogIn className="h-4 w-4 mr-1" /> Check In
                          </Button>
                        )}
                        {s.status === "in_progress" && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(s.id)}>
                            <LogOut className="h-4 w-4 mr-1" /> Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden lg:table-cell">Check In</TableHead>
                    <TableHead className="hidden lg:table-cell">Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">No service records</TableCell></TableRow>
                  ) : services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.participant_name}</TableCell>
                      <TableCell className="text-sm">{s.worker_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{s.service_type}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{s.check_in_time?.split("T")[0]}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{s.total_hours}h</TableCell>
                      <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openNotes(s.id)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Case Notes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {notes.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No notes yet</p>
              ) : notes.map((n) => (
                <div key={n.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{n.worker_name}</span>
                    <Badge variant="outline" className="text-xs">{n.note_type}</Badge>
                  </div>
                  <p className="text-sm text-zinc-600">{n.note_text}</p>
                  <p className="text-xs text-zinc-400 mt-1">{n.created_at}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex gap-2">
                <select value={noteType} onChange={e => setNoteType(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                  <option value="progress">Progress</option>
                  <option value="observation">Observation</option>
                  <option value="concern">Concern</option>
                </select>
              </div>
              <Textarea placeholder="Write a case note..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} />
              <Button onClick={addNote} className="w-full" disabled={!newNote.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
