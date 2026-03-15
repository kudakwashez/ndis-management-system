const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  return response;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await request(path, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }
  return response.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: { id: number; email: string; full_name: string; role: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, full_name: string, role: string) =>
    api<{ access_token: string; user: { id: number; email: string; full_name: string; role: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name, role }),
    }),
  me: () => api<{ id: number; email: string; full_name: string; role: string }>("/api/auth/me"),
};

// Participants
export const participantsApi = {
  list: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api<any[]>(`/api/participants${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api<any>(`/api/participants/${id}`),
  create: (data: any) => api<any>("/api/participants", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/participants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => api<any>(`/api/participants/${id}`, { method: "DELETE" }),
  budget: (id: number) => api<any>(`/api/participants/${id}/budget`),
};

// Agreements
export const agreementsApi = {
  list: (participantId: number) => api<any[]>(`/api/participants/${participantId}/agreements`),
  create: (participantId: number, data: any) =>
    api<any>(`/api/participants/${participantId}/agreements`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/agreements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// Workers
export const workersApi = {
  list: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api<any[]>(`/api/workers${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api<any>(`/api/workers/${id}`),
  create: (data: any) => api<any>("/api/workers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/workers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  certifications: (id: number) => api<any>(`/api/workers/${id}/certifications`),
};

// Schedules
export const schedulesApi = {
  list: (params?: { date_from?: string; date_to?: string; worker_id?: number; participant_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.set("date_from", params.date_from);
    if (params?.date_to) query.set("date_to", params.date_to);
    if (params?.worker_id) query.set("worker_id", String(params.worker_id));
    if (params?.participant_id) query.set("participant_id", String(params.participant_id));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return api<any[]>(`/api/schedules${qs ? `?${qs}` : ""}`);
  },
  create: (data: any) => api<any>("/api/schedules", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => api<any>(`/api/schedules/${id}`, { method: "DELETE" }),
  today: () => api<any[]>("/api/schedules/today"),
};

// Services
export const servicesApi = {
  list: (params?: { status?: string; worker_id?: number; participant_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.worker_id) query.set("worker_id", String(params.worker_id));
    if (params?.participant_id) query.set("participant_id", String(params.participant_id));
    const qs = query.toString();
    return api<any[]>(`/api/services${qs ? `?${qs}` : ""}`);
  },
  checkIn: (scheduleId: number) => api<any>(`/api/services/${scheduleId}/checkin`, { method: "POST" }),
  checkOut: (scheduleId: number, data: { signature_data?: string; notes?: string }) =>
    api<any>(`/api/services/${scheduleId}/checkout`, { method: "POST", body: JSON.stringify(data) }),
  notes: (serviceId: number) => api<any[]>(`/api/services/${serviceId}/notes`),
  addNote: (serviceId: number, data: { note_text: string; note_type: string }) =>
    api<any>(`/api/services/${serviceId}/notes`, { method: "POST", body: JSON.stringify(data) }),
};

// Claims
export const claimsApi = {
  list: (params?: { status?: string; participant_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.participant_id) query.set("participant_id", String(params.participant_id));
    const qs = query.toString();
    return api<any[]>(`/api/claims${qs ? `?${qs}` : ""}`);
  },
  create: (data: any) => api<any>("/api/claims", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/claims/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  summary: () => api<any>("/api/claims/summary"),
};

// Incidents
export const incidentsApi = {
  list: (params?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.severity) query.set("severity", params.severity);
    const qs = query.toString();
    return api<any[]>(`/api/incidents${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api<any>(`/api/incidents/${id}`),
  create: (data: any) => api<any>("/api/incidents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/incidents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// Complaints
export const complaintsApi = {
  list: (params?: { status?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    const qs = query.toString();
    return api<any[]>(`/api/complaints${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api<any>(`/api/complaints/${id}`),
  create: (data: any) => api<any>("/api/complaints", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => api<any>(`/api/complaints/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// Dashboard
export const dashboardApi = {
  summary: () => api<any>("/api/dashboard/summary"),
  complianceReport: () => api<any>("/api/reports/compliance"),
  serviceReport: () => api<any>("/api/reports/services"),
};
