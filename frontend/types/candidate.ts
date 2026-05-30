import type { ApplicationStatus } from "@/types/jobs";

export interface ApplicationHistoryEntry {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_email: string | null;
  notes: string;
  changed_at: string;
}

export interface Resume {
  id: string;
  candidate: string;
  application: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: "pending" | "processing" | "completed" | "error";
  download_url: string | null;
  created_at: string;
}

export interface CandidateApplication {
  id: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    linkedin_url: string;
    github_url: string;
    created_at: string;
  };
  job_id: string;
  job_title: string;
  job_slug: string;
  organization: string;
  organization_name: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  history?: ApplicationHistoryEntry[];
  resumes?: Resume[];
}

export interface CandidateProfile {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  application_count: number;
  created_at?: string;
}

export interface PipelineColumn {
  status: ApplicationStatus;
  label: string;
  count: number;
  applications: CandidateApplication[];
}

export interface PipelineBoard {
  columns: PipelineColumn[];
}
