"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, FileText, Plus } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getApplications } from "@/lib/applications";
import { getJobs } from "@/lib/jobs";

interface Stats {
  openJobs: number;
  draftJobs: number;
  totalApplications: number;
  pendingApplications: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadStats() {
      try {
        const [published, draft, applications] = await Promise.all([
          getJobs({ status: "published" }),
          getJobs({ status: "draft" }),
          getApplications(),
        ]);
        if (!ignore) {
          setStats({
            openJobs: published.length,
            draftJobs: draft.length,
            totalApplications: applications.length,
            pendingApplications: applications.filter((a) => a.status === "applied").length,
          });
        }
      } catch {
        // Stats are non-critical — silently fail
      } finally {
        if (!ignore) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  if (!user) return null;

  const statCards = [
    {
      label: "Open jobs",
      value: stats?.openJobs ?? "—",
      sub: `${stats?.draftJobs ?? "—"} drafts`,
      icon: BriefcaseBusiness,
      href: "/dashboard/jobs?status=published",
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Applications",
      value: stats?.totalApplications ?? "—",
      sub: `${stats?.pendingApplications ?? "—"} new`,
      icon: FileText,
      href: "/dashboard/applications",
      color: "text-success-600 bg-success-600/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Welcome back, {user.first_name || user.email.split("@")[0]}
          </h1>
          {user.recruiter_profile && (
            <p className="mt-1 text-sm text-neutral-500">
              {user.recruiter_profile.organization?.name}
              {" · "}
              <span
                className={`font-medium ${
                  user.recruiter_profile.verification_status === "approved"
                    ? "text-success-600"
                    : user.recruiter_profile.verification_status === "pending"
                      ? "text-warning-600"
                      : "text-danger-600"
                }`}
              >
                {user.recruiter_profile.verification_status.charAt(0).toUpperCase() +
                  user.recruiter_profile.verification_status.slice(1)}
              </span>
            </p>
          )}
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New job
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-panel transition hover:border-primary-300 hover:shadow-md"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {statsLoading ? (
                  <span className="inline-block h-7 w-10 animate-pulse rounded bg-neutral-200" />
                ) : (
                  card.value
                )}
              </div>
              <div className="text-sm font-medium text-neutral-600">{card.label}</div>
              <div className="text-xs text-neutral-400">{card.sub}</div>
            </div>
          </Link>
        ))}

        {/* Quick-add job card */}
        <Link
          href="/dashboard/jobs/new"
          className="flex h-full min-h-[100px] items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white p-5 text-sm font-medium text-neutral-500 shadow-panel transition hover:border-primary-400 hover:text-primary-600"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Post a new job
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-panel">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Quick links</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/jobs"
              className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <BriefcaseBusiness className="h-4 w-4 text-primary-500" aria-hidden="true" />
              All job postings
            </Link>
            <Link
              href="/dashboard/applications"
              className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <FileText className="h-4 w-4 text-success-600" aria-hidden="true" />
              All applications
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-panel">
          <h2 className="mb-2 text-base font-semibold text-neutral-900">Resume uploads</h2>
          <p className="text-sm text-neutral-500">
            Resumes are attached to applications so recruiters can access the right file
            securely from each candidate submission.
          </p>
          <Link
            href="/dashboard/applications"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <FileText className="h-4 w-4 text-success-600" aria-hidden="true" />
            Open applications
          </Link>
        </div>
      </div>
    </div>
  );
}
