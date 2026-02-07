"use client";

import { createContext, useCallback, useMemo, useState, ReactNode } from "react";
import { Job, KidJobInstance, ChildId, JobStatus, JobAssignment } from "@/types";
import { MOCK_JOBS, INITIAL_JOB_INSTANCES } from "@/lib/mock-data";

interface PocketMoneyContextType {
  jobs: Job[];
  jobInstances: KidJobInstance[];
  addJob: (job: Omit<Job, "id">) => void;
  editJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  startJob: (jobId: string, childId: ChildId) => void;
  completeJob: (instanceId: string) => void;
  approveJob: (instanceId: string) => void;
  rejectJob: (instanceId: string) => void;
  getJobsForChild: (childId: ChildId) => Job[];
  getInstancesForChild: (childId: ChildId) => KidJobInstance[];
  getAvailableJobs: (childId: ChildId) => Job[];
  getInProgressJobs: (childId: ChildId) => (KidJobInstance & { job: Job })[];
  getCompletedJobs: (childId: ChildId) => (KidJobInstance & { job: Job })[];
  getPendingApprovals: () => (KidJobInstance & { job: Job })[];
  getWeeklyEarnings: (childId: ChildId) => number;
  getWeeklyPotential: (childId: ChildId) => number;
  getJobById: (id: string) => Job | undefined;
}

export const PocketMoneyContext = createContext<PocketMoneyContextType | null>(null);

let nextInstanceId = 100;

export function PocketMoneyProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [jobInstances, setJobInstances] = useState<KidJobInstance[]>(INITIAL_JOB_INSTANCES);

  const addJob = useCallback((job: Omit<Job, "id">) => {
    const id = `job-${Date.now()}`;
    setJobs((prev) => [...prev, { ...job, id }]);
  }, []);

  const editJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setJobInstances((prev) => prev.filter((i) => i.jobId !== id));
  }, []);

  const startJob = useCallback((jobId: string, childId: ChildId) => {
    const instance: KidJobInstance = {
      id: `inst-${nextInstanceId++}`,
      jobId,
      childId,
      status: "in_progress",
      startedAt: Date.now(),
    };
    setJobInstances((prev) => [...prev, instance]);
  }, []);

  const completeJob = useCallback((instanceId: string) => {
    setJobInstances((prev) =>
      prev.map((i) =>
        i.id === instanceId ? { ...i, status: "completed" as JobStatus, completedAt: Date.now() } : i
      )
    );
  }, []);

  const approveJob = useCallback((instanceId: string) => {
    setJobInstances((prev) =>
      prev.map((i) =>
        i.id === instanceId ? { ...i, status: "approved" as JobStatus, approvedAt: Date.now() } : i
      )
    );
  }, []);

  const rejectJob = useCallback((instanceId: string) => {
    setJobInstances((prev) =>
      prev.map((i) =>
        i.id === instanceId ? { ...i, status: "rejected" as JobStatus } : i
      )
    );
  }, []);

  const getJobById = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs]);

  const getJobsForChild = useCallback(
    (childId: ChildId) =>
      jobs.filter((j) => j.assignedTo === "both" || j.assignedTo === childId),
    [jobs]
  );

  const getInstancesForChild = useCallback(
    (childId: ChildId) => jobInstances.filter((i) => i.childId === childId),
    [jobInstances]
  );

  const getAvailableJobs = useCallback(
    (childId: ChildId) => {
      const childJobs = getJobsForChild(childId);
      const activeInstanceJobIds = new Set(
        jobInstances
          .filter((i) => i.childId === childId && (i.status === "in_progress" || i.status === "completed"))
          .map((i) => i.jobId)
      );
      return childJobs.filter((j) => !activeInstanceJobIds.has(j.id));
    },
    [getJobsForChild, jobInstances]
  );

  const getInProgressJobs = useCallback(
    (childId: ChildId) =>
      jobInstances
        .filter((i) => i.childId === childId && i.status === "in_progress")
        .map((i) => ({ ...i, job: jobs.find((j) => j.id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getCompletedJobs = useCallback(
    (childId: ChildId) =>
      jobInstances
        .filter((i) => i.childId === childId && i.status === "completed")
        .map((i) => ({ ...i, job: jobs.find((j) => j.id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getPendingApprovals = useCallback(
    () =>
      jobInstances
        .filter((i) => i.status === "completed")
        .map((i) => ({ ...i, job: jobs.find((j) => j.id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getWeeklyEarnings = useCallback(
    (childId: ChildId) => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return jobInstances
        .filter(
          (i) =>
            i.childId === childId &&
            i.status === "approved" &&
            i.approvedAt &&
            i.approvedAt > weekAgo
        )
        .reduce((sum, i) => {
          const job = jobs.find((j) => j.id === i.jobId);
          return sum + (job?.yenAmount || 0);
        }, 0);
    },
    [jobInstances, jobs]
  );

  const getWeeklyPotential = useCallback(
    (childId: ChildId) => {
      const childJobs = getJobsForChild(childId);
      return childJobs.reduce((sum, j) => sum + j.yenAmount * j.weeklyLimit, 0);
    },
    [getJobsForChild]
  );

  const value = useMemo(
    () => ({
      jobs,
      jobInstances,
      addJob,
      editJob,
      deleteJob,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      getJobsForChild,
      getInstancesForChild,
      getAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getJobById,
    }),
    [
      jobs,
      jobInstances,
      addJob,
      editJob,
      deleteJob,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      getJobsForChild,
      getInstancesForChild,
      getAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getJobById,
    ]
  );

  return (
    <PocketMoneyContext.Provider value={value}>
      {children}
    </PocketMoneyContext.Provider>
  );
}
