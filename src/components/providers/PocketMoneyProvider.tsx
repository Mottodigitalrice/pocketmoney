"use client";

import { createContext, useCallback, useMemo, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Job, JobInstance, JobInstanceWithJob, Child, ScheduledJob, ScheduledJobWithJob } from "@/types";

// Helper to get today's date as YYYY-MM-DD in local timezone
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get the Monday of the week containing the given date
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get all dates in the week (Mon-Sun)
function getWeekDates(date: Date = new Date()): string[] {
  const monday = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return getLocalDateString(d);
  });
}

interface PocketMoneyContextType {
  isLoading: boolean;
  userId: string | null;
  familyChildren: Child[];
  jobs: Job[];
  jobInstances: JobInstance[];
  scheduledJobs: ScheduledJob[];
  // Job library CRUD
  addJob: (job: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    icon: string;
    titleKey?: string;
    isOneOff?: boolean;
  }) => Promise<string | undefined>;
  editJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  // Scheduling
  scheduleJob: (jobId: string, childId: string, date: string) => void;
  scheduleJobBatch: (entries: { jobId: string; childId: string; date: string }[]) => void;
  removeScheduledJob: (scheduledJobId: string) => void;
  clearScheduledDay: (childId: string, date: string) => void;
  // Quick assign: schedule a job for today for a child
  quickAssign: (jobId: string, childId: string) => void;
  // One-off: create a temporary job + schedule it for today
  createOneOff: (title: string, titleJa: string | undefined, yenAmount: number, icon: string, childId: string) => void;
  // Job instance lifecycle
  startJob: (jobId: string, childId: string, scheduledJobId?: string) => void;
  completeJob: (instanceId: string) => void;
  approveJob: (instanceId: string) => void;
  rejectJob: (instanceId: string) => void;
  // Derived data
  getScheduledJobsForChildDate: (childId: string, date: string) => ScheduledJobWithJob[];
  getScheduledJobsForWeek: (childId: string, weekStart?: Date) => ScheduledJobWithJob[];
  getTodayAvailableJobs: (childId: string) => ScheduledJobWithJob[];
  getInProgressJobs: (childId: string) => JobInstanceWithJob[];
  getCompletedJobs: (childId: string) => JobInstanceWithJob[];
  getPendingApprovals: () => JobInstanceWithJob[];
  getWeeklyEarnings: (childId: string) => number;
  getWeeklyPotential: (childId: string) => number;
  getInstancesForChild: (childId: string) => JobInstance[];
  getJobById: (id: string) => Job | undefined;
  getChildById: (id: string) => Child | undefined;
  // Child management
  addChild: (name: string, icon: string) => void;
  editChild: (childId: string, name: string, icon: string) => void;
  deleteChild: (childId: string) => void;
  // Utilities
  getLocalDateString: (date?: Date) => string;
  getWeekDates: (date?: Date) => string[];
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
  );

  const rawInstances = useQuery(
    api.functions.jobInstances.getByFamily,
    userIdForQueries ? { userId: userIdForQueries } : "skip"
  );

  const rawScheduledJobs = useQuery(
    api.functions.scheduledJobs.getByFamily,
    userIdForQueries ? { userId: userIdForQueries } : "skip"
  );

  // Map Convex documents to app types
  const jobs: Job[] = useMemo(
    () =>
      (rawJobs ?? []).map((j: NonNullable<typeof rawJobs>[number]) => ({
        _id: j._id,
        userId: j.userId,
        title: j.title,
        titleJa: j.titleJa,
        titleKey: j.titleKey,
        yenAmount: j.yenAmount,
        icon: j.icon,
        isOneOff: j.isOneOff,
        createdAt: j.createdAt,
      })),
    [rawJobs]
  );

  const jobInstances: JobInstance[] = useMemo(
    () =>
      (rawInstances ?? []).map((i: NonNullable<typeof rawInstances>[number]) => ({
        _id: i._id,
        userId: i.userId,
        jobId: i.jobId,
        childId: i.childId,
        scheduledJobId: i.scheduledJobId,
        status: i.status,
        startedAt: i.startedAt,
        completedAt: i.completedAt,
        approvedAt: i.approvedAt,
        createdAt: i.createdAt,
      })),
    [rawInstances]
  );

  const scheduledJobs: ScheduledJob[] = useMemo(
    () =>
      (rawScheduledJobs ?? []).map((s: NonNullable<typeof rawScheduledJobs>[number]) => ({
        _id: s._id,
        userId: s.userId,
        jobId: s.jobId,
        childId: s.childId,
        date: s.date,
        createdAt: s.createdAt,
      })),
    [rawScheduledJobs]
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
  const createScheduledJobMutation = useMutation(api.functions.scheduledJobs.create);
  const createScheduledJobBatchMutation = useMutation(api.functions.scheduledJobs.createBatch);
  const removeScheduledJobMutation = useMutation(api.functions.scheduledJobs.remove);
  const clearScheduledDayMutation = useMutation(api.functions.scheduledJobs.clearDay);

  const isLoading = !clerkLoaded || (!!user && (
    convexUser === undefined ||
    rawChildren === undefined ||
    rawJobs === undefined ||
    rawInstances === undefined ||
    rawScheduledJobs === undefined
  ));

  // Job library mutations
  const addJob = useCallback(
    async (job: {
      title: string;
      titleJa?: string;
      yenAmount: number;
      icon: string;
      titleKey?: string;
      isOneOff?: boolean;
    }) => {
      if (!userIdForQueries) return;
      const id = await createJobMutation({
        userId: userIdForQueries,
        title: job.title,
        titleJa: job.titleJa,
        yenAmount: job.yenAmount,
        icon: job.icon,
        titleKey: job.titleKey,
        isOneOff: job.isOneOff,
      });
      return id;
    },
    [userIdForQueries, createJobMutation]
  );

  const editJob = useCallback(
    (id: string, updates: Partial<Job>) => {
      updateJobMutation({
        jobId: id as Id<"jobs">,
        title: updates.title,
        yenAmount: updates.yenAmount,
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

  // Scheduling mutations
  const scheduleJob = useCallback(
    (jobId: string, childId: string, date: string) => {
      if (!userIdForQueries) return;
      createScheduledJobMutation({
        userId: userIdForQueries,
        jobId: jobId as Id<"jobs">,
        childId: childId as Id<"children">,
        date,
      });
    },
    [userIdForQueries, createScheduledJobMutation]
  );

  const scheduleJobBatch = useCallback(
    (entries: { jobId: string; childId: string; date: string }[]) => {
      if (!userIdForQueries) return;
      createScheduledJobBatchMutation({
        userId: userIdForQueries,
        entries: entries.map((e) => ({
          jobId: e.jobId as Id<"jobs">,
          childId: e.childId as Id<"children">,
          date: e.date,
        })),
      });
    },
    [userIdForQueries, createScheduledJobBatchMutation]
  );

  const removeScheduledJob = useCallback(
    (scheduledJobId: string) => {
      removeScheduledJobMutation({ scheduledJobId: scheduledJobId as Id<"scheduledJobs"> });
    },
    [removeScheduledJobMutation]
  );

  const clearScheduledDay = useCallback(
    (childId: string, date: string) => {
      clearScheduledDayMutation({
        childId: childId as Id<"children">,
        date,
      });
    },
    [clearScheduledDayMutation]
  );

  // Quick assign: schedule a library job for today
  const quickAssign = useCallback(
    (jobId: string, childId: string) => {
      scheduleJob(jobId, childId, getLocalDateString());
    },
    [scheduleJob]
  );

  // One-off: create a temporary job + schedule for today
  const createOneOff = useCallback(
    async (title: string, titleJa: string | undefined, yenAmount: number, icon: string, childId: string) => {
      if (!userIdForQueries) return;
      const jobId = await createJobMutation({
        userId: userIdForQueries,
        title,
        titleJa,
        yenAmount,
        icon,
        isOneOff: true,
      });
      if (jobId) {
        createScheduledJobMutation({
          userId: userIdForQueries,
          jobId,
          childId: childId as Id<"children">,
          date: getLocalDateString(),
        });
      }
    },
    [userIdForQueries, createJobMutation, createScheduledJobMutation]
  );

  // Job instance mutations
  const startJob = useCallback(
    (jobId: string, childId: string, scheduledJobId?: string) => {
      if (!userIdForQueries) return;
      startJobMutation({
        userId: userIdForQueries,
        jobId: jobId as Id<"jobs">,
        childId: childId as Id<"children">,
        scheduledJobId: scheduledJobId as Id<"scheduledJobs"> | undefined,
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

  const getInstancesForChild = useCallback(
    (childId: string) => jobInstances.filter((i) => i.childId === childId),
    [jobInstances]
  );

  // Get scheduled jobs for a child on a specific date, with job details attached
  const getScheduledJobsForChildDate = useCallback(
    (childId: string, date: string): ScheduledJobWithJob[] =>
      scheduledJobs
        .filter((s) => s.childId === childId && s.date === date)
        .map((s) => ({ ...s, job: jobs.find((j) => j._id === s.jobId)! }))
        .filter((s) => s.job),
    [scheduledJobs, jobs]
  );

  // Get all scheduled jobs for a child in a given week
  const getScheduledJobsForWeek = useCallback(
    (childId: string, weekStart?: Date): ScheduledJobWithJob[] => {
      const dates = getWeekDates(weekStart);
      return scheduledJobs
        .filter((s) => s.childId === childId && dates.includes(s.date))
        .map((s) => ({ ...s, job: jobs.find((j) => j._id === s.jobId)! }))
        .filter((s) => s.job);
    },
    [scheduledJobs, jobs]
  );

  // Get today's scheduled jobs that haven't been started yet
  const getTodayAvailableJobs = useCallback(
    (childId: string): ScheduledJobWithJob[] => {
      const today = getLocalDateString();
      const todayScheduled = getScheduledJobsForChildDate(childId, today);

      // Find which scheduled jobs already have active instances
      const activeScheduledJobIds = new Set(
        jobInstances
          .filter(
            (i) =>
              i.childId === childId &&
              i.scheduledJobId &&
              (i.status === "in_progress" || i.status === "completed")
          )
          .map((i) => i.scheduledJobId)
      );

      return todayScheduled.filter((s) => !activeScheduledJobIds.has(s._id));
    },
    [getScheduledJobsForChildDate, jobInstances]
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

  // Weekly potential = sum of all scheduled jobs for this week
  const getWeeklyPotential = useCallback(
    (childId: string) => {
      const weekScheduled = getScheduledJobsForWeek(childId);
      return weekScheduled.reduce((sum, s) => sum + s.job.yenAmount, 0);
    },
    [getScheduledJobsForWeek]
  );

  const value = useMemo(
    () => ({
      isLoading,
      userId: userIdForQueries ?? null,
      familyChildren: mappedChildren,
      jobs,
      jobInstances,
      scheduledJobs,
      addJob,
      editJob,
      deleteJob,
      scheduleJob,
      scheduleJobBatch,
      removeScheduledJob,
      clearScheduledDay,
      quickAssign,
      createOneOff,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      getScheduledJobsForChildDate,
      getScheduledJobsForWeek,
      getTodayAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getInstancesForChild,
      getJobById,
      getChildById,
      addChild,
      editChild,
      deleteChild,
      getLocalDateString,
      getWeekDates,
    }),
    [
      isLoading,
      userIdForQueries,
      mappedChildren,
      jobs,
      jobInstances,
      scheduledJobs,
      addJob,
      editJob,
      deleteJob,
      scheduleJob,
      scheduleJobBatch,
      removeScheduledJob,
      clearScheduledDay,
      quickAssign,
      createOneOff,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      getScheduledJobsForChildDate,
      getScheduledJobsForWeek,
      getTodayAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getInstancesForChild,
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
