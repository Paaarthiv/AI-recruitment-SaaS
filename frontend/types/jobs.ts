export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type JobStatus = "draft" | "published" | "closed" | "archived";
export type RemotePolicy = "onsite" | "hybrid" | "remote";
export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "technical_round"
  | "hr_round"
  | "offer"
  | "rejected"
  | "hired";

export interface Job {
  id: string;
  organization: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  location: string;
  department: string;
  employment_type: EmploymentType;
  remote_policy: RemotePolicy;
  salary_range: string;
  status: JobStatus;
  created_by: string;
  application_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicJob {
  id: string;
  title: string;
  slug: string;
  organization_name: string;
  description: string;
  requirements: string;
  location: string;
  department: string;
  employment_type: EmploymentType;
  remote_policy: RemotePolicy;
  salary_range: string;
  published_at: string | null;
  created_at: string;
}

export interface JobPayload {
  title: string;
  description: string;
  requirements: string;
  location: string;
  department: string;
  employment_type: EmploymentType;
  remote_policy: RemotePolicy;
  salary_range: string;
  status?: JobStatus;
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  created_at: string;
}

export interface Application {
  id: string;
  candidate: Candidate;
  job_id: string;
  job_title: string;
  organization: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  history?: import("./candidate").ApplicationHistoryEntry[];
  resumes?: import("./candidate").Resume[];
}

export interface ApplicationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
}
