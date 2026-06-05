import { apiFetch } from "@/lib/api";
import type { Application } from "@/types/jobs";

export async function getApplications(jobId?: string): Promise<Application[]> {
  const query = jobId ? `?job=${jobId}` : "";
  return apiFetch<Application[]>(`/api/v1/applications/${query}`, { method: "GET" });
}

export async function getApplication(id: string): Promise<Application> {
  return apiFetch<Application>(`/api/v1/applications/${id}/`, { method: "GET" });
}
