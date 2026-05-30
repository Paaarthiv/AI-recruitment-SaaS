"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, Clock, Trophy, ChevronRight, Hand } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getCandidateApplications } from "@/lib/candidate";
import type { CandidateApplication } from "@/types/candidate";
import type { ApplicationStatus } from "@/types/jobs";

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied: "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20",
  under_review: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-600/20",
  shortlisted: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  technical_round: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
  hr_round: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  offer: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20",
  rejected: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  hired: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  technical_round: "Technical Round",
  hr_round: "HR Round",
  offer: "Offer",
  rejected: "Rejected",
  hired: "Hired",
};

function formatDate(v: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(v),
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-4 relative z-10">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <div className="text-3xl font-bold tracking-tight text-neutral-900">{value}</div>
          <div className="text-sm font-medium text-neutral-500">{label}</div>
        </div>
      </div>
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150 ${colorClass.split(' ')[0]}`}></div>
    </div>
  );
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getCandidateApplications()
      .then((data) => { if (!ignore) setApplications(data); })
      .catch(() => {})
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, []);

  const active = applications.filter(
    (a) => !["rejected", "hired", "archived"].includes(a.status),
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <Hand className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome back, {user?.first_name || "there"}
          </h1>
          <p className="text-sm text-neutral-500">
            Here is a summary of your job applications and status.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total applications"
          value={isLoading ? "—" : applications.length}
          icon={BriefcaseBusiness}
          colorClass="bg-primary-50 text-primary-600"
        />
        <StatCard
          label="Active"
          value={isLoading ? "—" : active}
          icon={Clock}
          colorClass="bg-warning-50 text-warning-600"
        />
        <StatCard
          label="Offers received"
          value={isLoading ? "—" : offers}
          icon={Trophy}
          colorClass="bg-success-50 text-success-600"
        />
      </div>

      {/* Recent applications */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
          <h2 className="text-base font-semibold text-neutral-900">Recent applications</h2>
          <Link
            href="/candidate/applications"
            className="group flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-neutral-400">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 mb-4">
              <BriefcaseBusiness className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-base font-medium text-neutral-900 mb-1">No applications yet</p>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">Find your next great opportunity by browsing our open jobs.</p>
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse open positions
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {applications.slice(0, 5).map((app) => (
              <li key={app.id}>
                <Link
                  href={`/candidate/applications/${app.id}`}
                  className="group flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50/80 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{app.job_title}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{app.organization_name}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[app.status]}`}
                    >
                      {app.status === "hired" && <Trophy className="mr-1.5 h-3 w-3" />}
                      {STATUS_LABEL[app.status]}
                    </span>
                    <span className="text-xs font-medium text-neutral-400">Applied on {formatDate(app.applied_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Browse CTA */}
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center transition-colors hover:border-primary-200 hover:bg-primary-50/30">
        <p className="text-base font-medium text-neutral-900">Looking for new opportunities?</p>
        <p className="mt-1 text-sm text-neutral-500 mb-6">Explore the latest job postings from top organizations.</p>
        <Link
          href="/jobs"
          className="inline-flex items-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 transition-all hover:bg-neutral-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          Browse open positions
        </Link>
      </div>
    </div>
  );
}
