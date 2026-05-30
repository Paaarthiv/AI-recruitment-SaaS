"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";

import { applyToJob, getPublicJob } from "@/lib/jobs";
import type { ApplicationPayload, PublicJob } from "@/types/jobs";

const initialForm: ApplicationPayload = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  linkedin_url: "",
  github_url: "",
};

function employmentLabel(value: string) {
  return value.replace("_", " ");
}

export default function PublicJobDetailPage() {
  const params = useParams<{ slug: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [form, setForm] = useState<ApplicationPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadJob() {
      try {
        setJob(await getPublicJob(params.slug));
      } catch {
        setError("Could not load this job.");
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();
  }, [params.slug]);

  function updateField(field: keyof ApplicationPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await applyToJob(job.id, form);
      setSuccess(true);
      setForm(initialForm);
    } catch {
      setError("Could not submit application. This email may have already applied.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8 text-sm text-neutral-500">
        Loading job...
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8 text-sm text-danger-600">
        {error || "Job not found."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/jobs" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
            Back to jobs
          </Link>
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Recruiter sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <article className="space-y-6">
          <div>
            <p className="text-sm font-medium text-primary-600">{job.organization_name}</p>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-900">{job.title}</h1>
            <p className="mt-3 text-sm text-neutral-600">
              {job.location} · {employmentLabel(job.employment_type)}
              {job.salary_range ? ` · ${job.salary_range}` : ""}
            </p>
          </div>

          <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-panel">
            <h2 className="text-base font-semibold text-neutral-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">
              {job.description}
            </p>
          </section>

          <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-panel">
            <h2 className="text-base font-semibold text-neutral-900">Requirements</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">
              {job.requirements}
            </p>
          </section>
        </article>

        <aside className="h-fit rounded-md border border-neutral-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-semibold text-neutral-900">Apply</h2>
          {success && (
            <div className="mt-4 rounded-md border border-success-600/20 bg-success-600/10 px-3 py-2 text-sm text-success-600">
              Application submitted.
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-md border border-danger-600/20 bg-danger-600/10 px-3 py-2 text-sm text-danger-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">First name</span>
                <input
                  value={form.first_name}
                  onChange={(event) => updateField("first_name", event.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Last name</span>
                <input
                  value={form.last_name}
                  onChange={(event) => updateField("last_name", event.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">LinkedIn URL</span>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={(event) => updateField("linkedin_url", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">GitHub URL</span>
              <input
                type="url"
                value={form.github_url}
                onChange={(event) => updateField("github_url", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
