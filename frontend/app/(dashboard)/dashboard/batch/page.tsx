"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCcw, UploadCloud } from "lucide-react";

import {
  createScheduledBatch,
  disableScheduledBatch,
  getBatchHistory,
  getScheduledBatches,
} from "@/lib/batch";
import { getJobs } from "@/lib/jobs";
import type { BatchJob, ScheduledBatchFrequency, ScheduledBatchOperation } from "@/types/batch";
import type { Job } from "@/types/jobs";

const TYPE_LABEL: Record<string, string> = {
  upload: "Bulk upload",
  score: "Batch score",
  pipeline_action: "Pipeline action",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  running: "bg-primary-50 text-primary-700",
  completed: "bg-success-600/10 text-success-700",
  completed_with_errors: "bg-warning-600/10 text-warning-700",
  failed: "bg-danger-600/10 text-danger-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BatchHistoryPage() {
  const [batches, setBatches] = useState<BatchJob[]>([]);
  const [schedules, setSchedules] = useState<ScheduledBatchOperation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scheduleJobId, setScheduleJobId] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduledBatchFrequency>("daily");
  const [scheduleRunAt, setScheduleRunAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [batchResponse, scheduleResponse, jobResponse] = await Promise.all([
        getBatchHistory(),
        getScheduledBatches(),
        getJobs({ status: "published" }),
      ]);
      setBatches(batchResponse);
      setSchedules(scheduleResponse);
      setJobs(jobResponse);
      setScheduleJobId((current) => current || jobResponse[0]?.id || "");
    } catch {
      setError("Could not load batch history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function handleCreateSchedule() {
    if (!scheduleJobId || !scheduleRunAt) return;
    setIsScheduling(true);
    setError(null);
    try {
      await createScheduledBatch({
        job_type: "score",
        params: { job_id: scheduleJobId },
        frequency: scheduleFrequency,
        next_run_at: new Date(scheduleRunAt).toISOString(),
      });
      const response = await getScheduledBatches();
      setSchedules(response);
    } catch {
      setError("Could not create schedule.");
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleDisableSchedule(id: string) {
    setError(null);
    try {
      await disableScheduledBatch(id);
      setSchedules(await getScheduledBatches());
    } catch {
      setError("Could not disable schedule.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Batch operations</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Track bulk uploads, batch scoring, and pipeline actions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/dashboard/batch/upload"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <UploadCloud className="h-4 w-4" />
            Bulk upload
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <h2 className="text-base font-semibold text-neutral-900">Scheduled scoring</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Run recurring score refreshes for a published job.
            </p>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-neutral-500">Job</span>
            <select
              value={scheduleJobId}
              onChange={(event) => setScheduleJobId(event.target.value)}
              className="mt-1 h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary-500"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-neutral-500">Frequency</span>
            <select
              value={scheduleFrequency}
              onChange={(event) =>
                setScheduleFrequency(event.target.value as ScheduledBatchFrequency)
              }
              className="mt-1 h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary-500"
            >
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-neutral-500">Next run</span>
            <input
              type="datetime-local"
              value={scheduleRunAt}
              onChange={(event) => setScheduleRunAt(event.target.value)}
              className="mt-1 h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <button
            type="button"
            onClick={handleCreateSchedule}
            disabled={!scheduleJobId || !scheduleRunAt || isScheduling}
            className="inline-flex h-10 items-center rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isScheduling ? "Scheduling..." : "Schedule"}
          </button>
        </div>

        {schedules.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Next run</th>
                  <th className="px-3 py-2">Last batch</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-3 py-2">{TYPE_LABEL[schedule.job_type]}</td>
                    <td className="px-3 py-2 capitalize">{schedule.frequency}</td>
                    <td className="px-3 py-2">{formatDate(schedule.next_run_at)}</td>
                    <td className="px-3 py-2">
                      {schedule.last_batch_id ? (
                        <Link
                          href={`/dashboard/batch/${schedule.last_batch_id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          Open
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {schedule.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleDisableSchedule(schedule.id)}
                          className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Disable
                        </button>
                      ) : (
                        <span className="text-neutral-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                  Loading batch history...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                  No batch operations yet.
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/batch/${batch.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {TYPE_LABEL[batch.job_type] ?? batch.job_type}
                    </Link>
                    <div className="text-xs text-neutral-500">{String(batch.params.job_title ?? "")}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_TONE[batch.status]
                      }`}
                    >
                      {batch.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">
                    {batch.processed_count}/{batch.total_count}
                    {batch.failed_count ? ` (${batch.failed_count} failed)` : ""}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">
                    {formatDate(batch.created_at)}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">
                    {batch.initiated_by_email ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
