"use client";

import { createContext, useCallback, useMemo, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Job, JobInstance, JobInstanceWithJob, Child } from "@/types";

interface PocketMoneyContextType {
  isLoading: boolean;
  userId: string | null;
  familyChildren: Child[];
  jobs: Job[];
  jobInstances: JobInstance[];
  addJob: (job: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    assignedTo: string;
    dailyLimit: number;
    weeklyLimit: number;
    icon: string;
    titleKey?: string;
  }) => void;
  editJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  startJob: (jobId: string, childId: string) => void;
  completeJob: (instanceId: string) => void;
  approveJob: (instanceId: string) => void;
  rejectJob: (instanceId: string) => void;
  getJobsForChild: (childId: string) => Job[];
  getInstancesForChild: (childId: string) => JobInstance[];
  getAvailableJobs: (childId: string) => Job[];
  getInProgressJobs: (childId: string) => JobInstanceWithJob[];
  getCompletedJobs: (childId: string) => JobInstanceWithJob[];
  getPendingApprovals: () => JobInstanceWithJob[];
  getWeeklyEarnings: (childId: string) => number;
  getWeeklyPotential: (childId: string) => number;
  getJobById: (id: string) => Job | undefined;
  getChildById: (id: string) => Child | undefined;
  addChild: (name: string, icon: string) => void;
  editChild: (childId: string, name: string, icon: string) => void;
  deleteChild: (childId: string) => void;
}

export const PocketMoneyContext = createContext<PocketMoneyContextType | null>(null);

export function PocketMoneyProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: clerkLoaded } = useUser();

  // Get the Convex user record
  const convexUser = useQuery(
    api.functions.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const userIdForQueries = convexUser?._id;

  // Query family data from Convex
  const rawChildren = useQuery(
    api.functions.children.getByFamily,
    userIdForQueries ? { userId: userIdForQueries } : "skip"
  );
  const familyChildren = rawChildren ?? [];

  const rawJobs = useQuery(
    api.functions.jobs.getByFamily,
    userIdForQueries ? { userId: userIdForQueries } : "skip"
  ) ?? [];

  const rawInstances = useQuery(
    api.functions.jobInstances.getByFamily,
    userIdForQueries ? { userId: userIdForQueries } : "skip"
  ) ?? [];

  // Map Convex documents to app types
  const jobs: Job[] = useMemo(
    () =>
      rawJobs.map((j: typeof rawJobs[number]) => ({
        _id: j._id,
        userId: j.userId,
        title: j.title,
        titleJa: j.titleJa,
        titleKey: j.titleKey,
        yenAmount: j.yenAmount,
        assignedTo: j.assignedTo,
        dailyLimit: j.dailyLimit,
        weeklyLimit: j.weeklyLimit,
        icon: j.icon,
        createdAt: j.createdAt,
      })),
    [rawJobs]
  );

  const jobInstances: JobInstance[] = useMemo(
    () =>
      rawInstances.map((i: typeof rawInstances[number]) => ({
        _id: i._id,
        userId: i.userId,
        jobId: i.jobId,
        childId: i.childId,
        status: i.status,
        startedAt: i.startedAt,
        completedAt: i.completedAt,
        approvedAt: i.approvedAt,
        createdAt: i.createdAt,
      })),
    [rawInstances]
  );

  const mappedChildren: Child[] = useMemo(
    () =>
      familyChildren.map((c: typeof familyChildren[number]) => ({
        _id: c._id,
        userId: c.userId,
        name: c.name,
        icon: c.icon as Child["icon"],
        createdAt: c.createdAt,
      })),
    [familyChildren]
  );

  // Mutations
  const createJobMutation = useMutation(api.functions.jobs.create);
  const updateJobMutation = useMutation(api.functions.jobs.update);
  const removeJobMutation = useMutation(api.functions.jobs.remove);
  const startJobMutation = useMutation(api.functions.jobInstances.start);
  const completeJobMutation = useMutation(api.functions.jobInstances.complete);
  const approveJobMutation = useMutation(api.functions.jobInstances.approve);
  const rejectJobMutation = useMutation(api.functions.jobInstances.reject);
  const createChildMutation = useMutation(api.functions.children.create);
  const updateChildMutation = useMutation(api.functions.children.update);
  const removeChildMutation = useMutation(api.functions.children.remove);

  const isLoading = !clerkLoaded || (!!user && (convexUser === undefined || rawChildren === undefined));

  // Job mutations
  const addJob = useCallback(
    (job: {
      title: string;
      titleJa?: string;
      yenAmount: number;
      assignedTo: string;
      dailyLimit: number;
      weeklyLimit: number;
      icon: string;
      titleKey?: string;
    }) => {
      if (!userIdForQueries) return;
      createJobMutation({
        userId: userIdForQueries,
        title: job.title,
        titleJa: job.titleJa,
        yenAmount: job.yenAmount,
        assignedTo: job.assignedTo,
        dailyLimit: job.dailyLimit,
        weeklyLimit: job.weeklyLimit,
        icon: job.icon,
        titleKey: job.titleKey,
      });
    },
    [userIdForQueries, createJobMutation]
  );

  const editJob = useCallback(
    (id: string, updates: Partial<Job>) => {
      updateJobMutation({
        jobId: id as Id<"jobs">,
        title: updates.title,
        yenAmount: updates.yenAmount,
        assignedTo: updates.assignedTo,
        dailyLimit: updates.dailyLimit,
        weeklyLimit: updates.weeklyLimit,
        icon: updates.icon,
      });
    },
    [updateJobMutation]
  );

  const deleteJob = useCallback(
    (id: string) => {
      removeJobMutation({ jobId: id as Id<"jobs"> });
    },
    [removeJobMutation]
  );

  // Job instance mutations
  const startJob = useCallback(
    (jobId: string, childId: string) => {
      if (!userIdForQueries) return;
      startJobMutation({
        userId: userIdForQueries,
        jobId: jobId as Id<"jobs">,
        childId: childId as Id<"children">,
      });
    },
    [userIdForQueries, startJobMutation]
  );

  const completeJob = useCallback(
    (instanceId: string) => {
      completeJobMutation({ instanceId: instanceId as Id<"jobInstances"> });
    },
    [completeJobMutation]
  );

  const approveJob = useCallback(
    (instanceId: string) => {
      approveJobMutation({ instanceId: instanceId as Id<"jobInstances"> });
    },
    [approveJobMutation]
  );

  const rejectJob = useCallback(
    (instanceId: string) => {
      rejectJobMutation({ instanceId: instanceId as Id<"jobInstances"> });
    },
    [rejectJobMutation]
  );

  // Child mutations
  const addChild = useCallback(
    (name: string, icon: string) => {
      if (!userIdForQueries) return;
      createChildMutation({ userId: userIdForQueries, name, icon });
    },
    [userIdForQueries, createChildMutation]
  );

  const editChild = useCallback(
    (childId: string, name: string, icon: string) => {
      updateChildMutation({
        childId: childId as Id<"children">,
        name,
        icon,
      });
    },
    [updateChildMutation]
  );

  const deleteChild = useCallback(
    (childId: string) => {
      removeChildMutation({ childId: childId as Id<"children"> });
    },
    [removeChildMutation]
  );

  // Derived data helpers
  const getJobById = useCallback(
    (id: string) => jobs.find((j) => j._id === id),
    [jobs]
  );

  const getChildById = useCallback(
    (id: string) => mappedChildren.find((c) => c._id === id),
    [mappedChildren]
  );

  const getJobsForChild = useCallback(
    (childId: string) =>
      jobs.filter((j) => j.assignedTo === "all" || j.assignedTo === childId),
    [jobs]
  );

  const getInstancesForChild = useCallback(
    (childId: string) => jobInstances.filter((i) => i.childId === childId),
    [jobInstances]
  );

  const getAvailableJobs = useCallback(
    (childId: string) => {
      const childJobs = getJobsForChild(childId);
      const activeInstanceJobIds = new Set(
        jobInstances
          .filter(
            (i) =>
              i.childId === childId &&
              (i.status === "in_progress" || i.status === "completed")
          )
          .map((i) => i.jobId)
      );
      return childJobs.filter((j) => !activeInstanceJobIds.has(j._id));
    },
    [getJobsForChild, jobInstances]
  );

  const getInProgressJobs = useCallback(
    (childId: string): JobInstanceWithJob[] =>
      jobInstances
        .filter((i) => i.childId === childId && i.status === "in_progress")
        .map((i) => ({ ...i, job: jobs.find((j) => j._id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getCompletedJobs = useCallback(
    (childId: string): JobInstanceWithJob[] =>
      jobInstances
        .filter((i) => i.childId === childId && i.status === "completed")
        .map((i) => ({ ...i, job: jobs.find((j) => j._id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getPendingApprovals = useCallback(
    (): JobInstanceWithJob[] =>
      jobInstances
        .filter((i) => i.status === "completed")
        .map((i) => ({ ...i, job: jobs.find((j) => j._id === i.jobId)! }))
        .filter((i) => i.job),
    [jobInstances, jobs]
  );

  const getWeeklyEarnings = useCallback(
    (childId: string) => {
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
          const job = jobs.find((j) => j._id === i.jobId);
          return sum + (job?.yenAmount || 0);
        }, 0);
    },
    [jobInstances, jobs]
  );

  const getWeeklyPotential = useCallback(
    (childId: string) => {
      const childJobs = getJobsForChild(childId);
      return childJobs.reduce((sum, j) => sum + j.yenAmount * j.weeklyLimit, 0);
    },
    [getJobsForChild]
  );

  const value = useMemo(
    () => ({
      isLoading,
      userId: userIdForQueries ?? null,
      familyChildren: mappedChildren,
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
      getChildById,
      addChild,
      editChild,
      deleteChild,
    }),
    [
      isLoading,
      userIdForQueries,
      mappedChildren,
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
      getChildById,
      addChild,
      editChild,
      deleteChild,
    ]
  );

  return (
    <PocketMoneyContext.Provider value={value}>
      {children}
    </PocketMoneyContext.Provider>
  );
}
