"use client";

import { useState } from "react";
import { Job } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";
import { JobForm } from "./JobForm";

export function JobManager() {
  const { jobs, addJob, editJob, deleteJob } = usePocketMoney();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();

  const handleAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleEdit = (job: Job) => {
    setEditing(job);
    setFormOpen(true);
  };

  const handleSave = (jobData: Omit<Job, "id">) => {
    if (editing) {
      editJob(editing.id, jobData);
    } else {
      addJob(jobData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h2 className="text-lg font-bold text-amber-100">All Jobs ({jobs.length})</h2>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-amber-600 font-bold text-white hover:bg-amber-700"
        >
          + New Job
        </Button>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3 backdrop-blur-sm"
          >
            <span className="text-2xl">{job.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-100 truncate">{job.title}</h3>
              <p className="text-xs text-amber-300/60">
                {job.assignedTo === "both"
                  ? "Both kids"
                  : job.assignedTo === "jayden"
                  ? "🦈 Jayden only"
                  : "🐬 Tyler only"}{" "}
                &middot; {job.dailyLimit}/day &middot; {job.weeklyLimit}/week
              </p>
            </div>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
              {CURRENCY}{job.yenAmount}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(job)}
                className="text-amber-300 hover:bg-amber-800/40 hover:text-amber-100"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteJob(job.id)}
                className="text-red-400 hover:bg-red-900/40 hover:text-red-300"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      <JobForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingJob={editing}
      />
    </div>
  );
}
