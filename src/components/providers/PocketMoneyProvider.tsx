"use client";

import { createContext, useCallback, useMemo, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Job,
  JobInstance,
  JobInstanceWithJob,
  Child,
  ScheduledJob,
  ScheduledJobWithJob,
  Wallet,
  WalletJar,
  WithdrawalReason,
  Transaction,
  Goal,
  JobPriority,
  RankProgress,
  JobRecurrence,
  LuckyChestStatus,
} from "@/types";
import { resizeImageForProof, uploadProofWithRetry } from "@/lib/photo-proof";
import { calculateRank } from "../../../convex/lib/rankMath";

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

// Rank thresholds live in `convex/lib/rankMath.ts` so backend and tests can
// share the same logic. See `calculateRank` import above.

interface PocketMoneyContextType {
  isLoading: boolean;
  userId: string | null;
  captainCodeEnabled: boolean;
  luckyChestMaxAmount: number;
  familyChildren: Child[];
  jobs: Job[];
  jobInstances: JobInstance[];
  scheduledJobs: ScheduledJob[];
  wallets: Wallet[];
  transactions: Transaction[];
  goals: Goal[];
  setCaptainCodeEnabled: (enabled: boolean) => Promise<void>;
  // Job library CRUD
  addJob: (job: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    icon: string;
    titleKey?: string;
    isOneOff?: boolean;
    requiresPhotoProof?: boolean;
    recurrence?: JobRecurrence;
  }) => Promise<string | undefined>;
  editJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  // Scheduling
  scheduleJob: (jobId: string, childId: string, date: string, priority?: JobPriority) => void;
  scheduleJobBatch: (entries: { jobId: string; childId: string; date: string; priority?: JobPriority }[]) => void;
  removeScheduledJob: (scheduledJobId: string) => void;
  clearScheduledDay: (childId: string, date: string) => void;
  applyRecurringJobsForWeek: (
    weekDates: string[],
    entries: { jobId: string; childIds: string[] }[]
  ) => Promise<void>;
  // Quick assign: schedule a job for today for a child
  quickAssign: (jobId: string, childId: string) => void;
  quickAddForToday: (
    jobId: string,
    childIds: string[],
    options?: { preApprove?: boolean; priority?: JobPriority }
  ) => Promise<void>;
  // One-off: create a temporary job + schedule it for today
  createOneOff: (title: string, titleJa: string | undefined, yenAmount: number, icon: string, childId: string) => void;
  // Job instance lifecycle
  startJob: (jobId: string, childId: string, scheduledJobId?: string) => void;
  completeJob: (instanceId: string, proofFile?: File) => Promise<void>;
  approveJob: (instanceId: string) => void;
  rejectJob: (instanceId: string, parentNote: string) => void;
  withdrawFromWallet: (input: {
    childId: string;
    jar: WalletJar;
    amount: number;
    reason: WithdrawalReason;
    note?: string;
  }) => Promise<void>;
  awardBonus: (input: {
    childId: string;
    amount: number;
    note?: string;
  }) => Promise<void>;
  setLuckyChestMaxAmount: (amount: number) => Promise<void>;
  openLuckyChest: (childId: string, weekDates?: string[]) => Promise<void>;
  createGoal: (input: {
    childId: string;
    title: string;
    targetAmount: number;
    emoji: string;
  }) => Promise<void>;
  // Derived data
  getScheduledJobsForChildDate: (childId: string, date: string) => ScheduledJobWithJob[];
  getScheduledJobsForWeek: (childId: string, weekStart?: Date) => ScheduledJobWithJob[];
  getTodayAvailableJobs: (childId: string) => ScheduledJobWithJob[];
  getInProgressJobs: (childId: string) => JobInstanceWithJob[];
  getCompletedJobs: (childId: string) => JobInstanceWithJob[];
  getPendingApprovals: () => JobInstanceWithJob[];
  getWeeklyEarnings: (childId: string) => number;
  getWeeklyPotential: (childId: string) => number;
  getLifetimeEarnings: (childId: string) => number;
  getWalletsForChild: (childId: string) => Wallet[];
  getWalletBalance: (childId: string, jar: WalletJar) => number;
  getWalletTotal: (childId: string) => number;
  getRankForChild: (childId: string) => RankProgress;
  getTransactionsForChild: (childId: string) => Transaction[];
  getGoalsForChild: (childId: string) => Goal[];
  getActiveGoalForChild: (childId: string) => Goal | undefined;
  getLuckyChestStatus: (childId: string) => LuckyChestStatus | undefined;
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

const hasDataProviders = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CONVEX_URL
);

const fallbackContextValue: PocketMoneyContextType = {
  isLoading: false,
  userId: null,
  captainCodeEnabled: false,
  luckyChestMaxAmount: 100,
  familyChildren: [],
  jobs: [],
  jobInstances: [],
  scheduledJobs: [],
  wallets: [],
  transactions: [],
  goals: [],
  setCaptainCodeEnabled: async () => {},
  addJob: async () => undefined,
  editJob: () => {},
  deleteJob: () => {},
  scheduleJob: () => {},
  scheduleJobBatch: () => {},
  removeScheduledJob: () => {},
  clearScheduledDay: () => {},
  applyRecurringJobsForWeek: async () => {},
  quickAssign: () => {},
  quickAddForToday: async () => {},
  createOneOff: () => {},
  startJob: () => {},
  completeJob: async () => {},
  approveJob: () => {},
  rejectJob: () => {},
  withdrawFromWallet: async () => {},
  awardBonus: async () => {},
  setLuckyChestMaxAmount: async () => {},
  openLuckyChest: async () => {},
  createGoal: async () => {},
  getScheduledJobsForChildDate: () => [],
  getScheduledJobsForWeek: () => [],
  getTodayAvailableJobs: () => [],
  getInProgressJobs: () => [],
  getCompletedJobs: () => [],
  getPendingApprovals: () => [],
  getWeeklyEarnings: () => 0,
  getWeeklyPotential: () => 0,
  getLifetimeEarnings: () => 0,
  getWalletsForChild: () => [],
  getWalletBalance: () => 0,
  getWalletTotal: () => 0,
  getRankForChild: () => ({
    rank: "Noob",
    nextRank: "Normal",
    score: 0,
    nextScore: 500,
    progress: 0,
    multiplier: 1,
  }),
  getTransactionsForChild: () => [],
  getGoalsForChild: () => [],
  getActiveGoalForChild: () => undefined,
  getLuckyChestStatus: () => undefined,
  getInstancesForChild: () => [],
  getJobById: () => undefined,
  getChildById: () => undefined,
  addChild: () => {},
  editChild: () => {},
  deleteChild: () => {},
  getLocalDateString,
  getWeekDates,
};

export function PocketMoneyProvider({ children }: { children: ReactNode }) {
  if (!hasDataProviders) {
    return (
      <PocketMoneyContext.Provider value={fallbackContextValue}>
        {children}
      </PocketMoneyContext.Provider>
    );
  }

  return <PocketMoneyProviderInner>{children}</PocketMoneyProviderInner>;
}

function PocketMoneyProviderInner({ children }: { children: ReactNode }) {
  const { user, isLoaded: clerkLoaded } = useUser();

  // Get the Convex user record
  const convexUser = useQuery(
    api.functions.users.getCurrent,
    user?.id ? {} : "skip"
  );

  const userIdForQueries = convexUser?._id;
  const captainCodeEnabled = convexUser?.captainCodeEnabled ?? false;
  const luckyChestMaxAmount = convexUser?.luckyChestMaxAmount ?? 100;
  const currentWeekDates = useMemo(() => getWeekDates(), []);

  // Query family data from Convex
  const rawChildren = useQuery(
    api.functions.children.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawJobs = useQuery(
    api.functions.jobs.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawInstances = useQuery(
    api.functions.jobInstances.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawScheduledJobs = useQuery(
    api.functions.scheduledJobs.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawWallets = useQuery(
    api.functions.wallets.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawTransactions = useQuery(
    api.functions.transactions.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawGoals = useQuery(
    api.functions.goals.getByFamily,
    userIdForQueries ? {} : "skip"
  );

  const rawLuckyChestStatuses = useQuery(
    api.functions.luckyChests.getStatusForFamily,
    userIdForQueries ? { weekDates: currentWeekDates } : "skip"
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
        requiresPhotoProof: j.requiresPhotoProof,
        recurrence: j.recurrence,
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
        rejectedAt: i.rejectedAt,
        rejectionCount: i.rejectionCount,
        parentNote: i.parentNote,
        proofStorageId: i.proofStorageId,
        proofFileName: i.proofFileName,
        proofContentType: i.proofContentType,
        proofFileSize: i.proofFileSize,
        proofUploadedAt: i.proofUploadedAt,
        proofDeletedAt: i.proofDeletedAt,
        proofUrl: i.proofUrl,
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
        priority: s.priority ?? "optional",
        createdAt: s.createdAt,
      })),
    [rawScheduledJobs]
  );

  const mappedChildren: Child[] = useMemo(
    () =>
      (rawChildren ?? []).map((c: NonNullable<typeof rawChildren>[number]) => ({
        _id: c._id,
        userId: c.userId,
        name: c.name,
        icon: c.icon as Child["icon"],
        age: c.age,
        rankMultiplier: c.rankMultiplier,
        createdAt: c.createdAt,
      })),
    [rawChildren]
  );

  const wallets: Wallet[] = useMemo(
    () =>
      (rawWallets ?? []).map((w: NonNullable<typeof rawWallets>[number]) => ({
        _id: w._id,
        userId: w.userId,
        childId: w.childId,
        jar: w.jar,
        balance: w.balance,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    [rawWallets]
  );

  const transactions: Transaction[] = useMemo(
    () =>
      (rawTransactions ?? []).map((tx: NonNullable<typeof rawTransactions>[number]) => ({
        _id: tx._id,
        userId: tx.userId,
        childId: tx.childId,
        walletId: tx.walletId,
        jar: tx.jar,
        amount: tx.amount,
        type: tx.type,
        reason: tx.reason,
        note: tx.note,
        jobInstanceId: tx.jobInstanceId,
        createdAt: tx.createdAt,
      })),
    [rawTransactions]
  );

  const goals: Goal[] = useMemo(
    () =>
      (rawGoals ?? []).map((goal: NonNullable<typeof rawGoals>[number]) => ({
        _id: goal._id,
        userId: goal.userId,
        childId: goal.childId,
        title: goal.title,
        targetAmount: goal.targetAmount,
        emoji: goal.emoji,
        status: goal.status,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      })),
    [rawGoals]
  );

  // Mutations
  const createJobMutation = useMutation(api.functions.jobs.create);
  const updateJobMutation = useMutation(api.functions.jobs.update);
  const removeJobMutation = useMutation(api.functions.jobs.remove);
  const startJobMutation = useMutation(api.functions.jobInstances.start);
  const completeJobMutation = useMutation(api.functions.jobInstances.complete);
  const generateProofUploadUrlMutation = useMutation(api.functions.jobInstances.generateProofUploadUrl);
  const approveJobMutation = useMutation(api.functions.jobInstances.approve);
  const rejectJobMutation = useMutation(api.functions.jobInstances.reject);
  const createChildMutation = useMutation(api.functions.children.create);
  const updateChildMutation = useMutation(api.functions.children.update);
  const removeChildMutation = useMutation(api.functions.children.remove);
  const createScheduledJobMutation = useMutation(api.functions.scheduledJobs.create);
  const createScheduledJobBatchMutation = useMutation(api.functions.scheduledJobs.createBatch);
  const applyRecurringForWeekMutation = useMutation(api.functions.scheduledJobs.applyRecurringForWeek);
  const quickAddForTodayMutation = useMutation(api.functions.scheduledJobs.quickAddForToday);
  const removeScheduledJobMutation = useMutation(api.functions.scheduledJobs.remove);
  const clearScheduledDayMutation = useMutation(api.functions.scheduledJobs.clearDay);
  const setCaptainCodeEnabledMutation = useMutation(api.functions.users.setCaptainCodeEnabled);
  const setLuckyChestMaxAmountMutation = useMutation(api.functions.users.setLuckyChestMaxAmount);
  const withdrawMutation = useMutation(api.functions.transactions.withdraw);
  const awardBonusMutation = useMutation(api.functions.wallets.awardBonus);
  const createGoalMutation = useMutation(api.functions.goals.create);
  const openLuckyChestMutation = useMutation(api.functions.luckyChests.open);

  const isLoading = !clerkLoaded || (!!user && (
    convexUser === undefined ||
    rawChildren === undefined ||
    rawJobs === undefined ||
    rawInstances === undefined ||
    rawScheduledJobs === undefined ||
    rawWallets === undefined ||
    rawTransactions === undefined ||
    rawGoals === undefined ||
    rawLuckyChestStatuses === undefined
  ));

  const setCaptainCodeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!userIdForQueries) return;
      await setCaptainCodeEnabledMutation({
        enabled,
      });
    },
    [userIdForQueries, setCaptainCodeEnabledMutation]
  );

  // Job library mutations
  const addJob = useCallback(
    async (job: {
      title: string;
      titleJa?: string;
      yenAmount: number;
      icon: string;
      titleKey?: string;
      isOneOff?: boolean;
      requiresPhotoProof?: boolean;
      recurrence?: JobRecurrence;
    }) => {
      if (!userIdForQueries) return;
      const id = await createJobMutation({
        title: job.title,
        titleJa: job.titleJa,
        yenAmount: job.yenAmount,
        icon: job.icon,
        titleKey: job.titleKey,
        isOneOff: job.isOneOff,
        requiresPhotoProof: job.requiresPhotoProof,
        recurrence: job.recurrence,
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
        requiresPhotoProof: updates.requiresPhotoProof,
        recurrence: updates.recurrence,
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
    (jobId: string, childId: string, date: string, priority: JobPriority = "optional") => {
      if (!userIdForQueries) return;
      createScheduledJobMutation({
        jobId: jobId as Id<"jobs">,
        childId: childId as Id<"children">,
        date,
        priority,
      });
    },
    [userIdForQueries, createScheduledJobMutation]
  );

  const scheduleJobBatch = useCallback(
    (entries: { jobId: string; childId: string; date: string; priority?: JobPriority }[]) => {
      if (!userIdForQueries) return;
      createScheduledJobBatchMutation({
        entries: entries.map((e) => ({
          jobId: e.jobId as Id<"jobs">,
          childId: e.childId as Id<"children">,
          date: e.date,
          priority: e.priority ?? "optional",
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

  const applyRecurringJobsForWeek = useCallback(
    async (
      weekDates: string[],
      entries: { jobId: string; childIds: string[] }[]
    ) => {
      if (!userIdForQueries || entries.length === 0) return;
      await applyRecurringForWeekMutation({
        weekDates,
        entries: entries.map((entry) => ({
          jobId: entry.jobId as Id<"jobs">,
          childIds: entry.childIds.map((childId) => childId as Id<"children">),
        })),
      });
    },
    [userIdForQueries, applyRecurringForWeekMutation]
  );

  // Quick assign: schedule a library job for today
  const quickAssign = useCallback(
    (jobId: string, childId: string) => {
      scheduleJob(jobId, childId, getLocalDateString());
    },
    [scheduleJob]
  );

  const quickAddForToday = useCallback(
    async (
      jobId: string,
      childIds: string[],
      options?: { preApprove?: boolean; priority?: JobPriority }
    ) => {
      if (!userIdForQueries || childIds.length === 0) return;
      await quickAddForTodayMutation({
        jobId: jobId as Id<"jobs">,
        childIds: childIds.map((childId) => childId as Id<"children">),
        date: getLocalDateString(),
        preApprove: options?.preApprove ?? false,
        priority: options?.priority ?? "optional",
      });
    },
    [userIdForQueries, quickAddForTodayMutation]
  );

  // One-off: create a temporary job + schedule for today
  const createOneOff = useCallback(
    async (title: string, titleJa: string | undefined, yenAmount: number, icon: string, childId: string) => {
      if (!userIdForQueries) return;
      const jobId = await createJobMutation({
        title,
        titleJa,
        yenAmount,
        icon,
        isOneOff: true,
      });
      if (jobId) {
        createScheduledJobMutation({
          jobId,
          childId: childId as Id<"children">,
          date: getLocalDateString(),
          priority: "optional",
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
        jobId: jobId as Id<"jobs">,
        childId: childId as Id<"children">,
        scheduledJobId: scheduledJobId as Id<"scheduledJobs"> | undefined,
      });
    },
    [userIdForQueries, startJobMutation]
  );

  const completeJob = useCallback(
    async (instanceId: string, proofFile?: File) => {
      if (!proofFile) {
        await completeJobMutation({ instanceId: instanceId as Id<"jobInstances"> });
        return;
      }

      const resizedProof = await resizeImageForProof(proofFile);
      // F12: uploadProofWithRetry handles in-flight dedupe (double-tap),
      // retryable 5xx errors (throws RetryablePhotoUploadError), and surfaces
      // a clean Error on permanent 4xx. Callers (JobCard) catch and either
      // show a Retry button or let the global mapper handle it.
      const { storageId, fileName, contentType, size } = await uploadProofWithRetry(
        resizedProof,
        {
          dedupeKey: instanceId,
          getUploadUrl: () => generateProofUploadUrlMutation(),
        }
      );

      await completeJobMutation({
        instanceId: instanceId as Id<"jobInstances">,
        proof: {
          storageId: storageId as Id<"_storage">,
          fileName,
          contentType,
          size,
        },
      });
    },
    [completeJobMutation, generateProofUploadUrlMutation]
  );

  const approveJob = useCallback(
    (instanceId: string) => {
      approveJobMutation({ instanceId: instanceId as Id<"jobInstances"> });
    },
    [approveJobMutation]
  );

  const rejectJob = useCallback(
    (instanceId: string, parentNote: string) => {
      rejectJobMutation({
        instanceId: instanceId as Id<"jobInstances">,
        parentNote,
      });
    },
    [rejectJobMutation]
  );

  const withdrawFromWallet = useCallback(
    async (input: {
      childId: string;
      jar: WalletJar;
      amount: number;
      reason: WithdrawalReason;
      note?: string;
    }) => {
      if (!userIdForQueries) return;
      await withdrawMutation({
        childId: input.childId as Id<"children">,
        jar: input.jar,
        amount: input.amount,
        reason: input.reason,
        note: input.note,
      });
    },
    [userIdForQueries, withdrawMutation]
  );

  const createGoal = useCallback(
    async (input: {
      childId: string;
      title: string;
      targetAmount: number;
      emoji: string;
    }) => {
      if (!userIdForQueries) return;
      await createGoalMutation({
        childId: input.childId as Id<"children">,
        title: input.title,
        targetAmount: input.targetAmount,
        emoji: input.emoji,
      });
    },
    [userIdForQueries, createGoalMutation]
  );

  const awardBonus = useCallback(
    async (input: { childId: string; amount: number; note?: string }) => {
      if (!userIdForQueries) return;
      await awardBonusMutation({
        childId: input.childId as Id<"children">,
        amount: input.amount,
        note: input.note,
      });
    },
    [userIdForQueries, awardBonusMutation]
  );

  const setLuckyChestMaxAmount = useCallback(
    async (amount: number) => {
      if (!userIdForQueries) return;
      await setLuckyChestMaxAmountMutation({ amount });
    },
    [userIdForQueries, setLuckyChestMaxAmountMutation]
  );

  const openLuckyChest = useCallback(
    async (childId: string, weekDates: string[] = currentWeekDates) => {
      if (!userIdForQueries) return;
      await openLuckyChestMutation({
        childId: childId as Id<"children">,
        weekDates,
      });
    },
    [userIdForQueries, openLuckyChestMutation, currentWeekDates]
  );

  // Child mutations
  const addChild = useCallback(
    (name: string, icon: string) => {
      if (!userIdForQueries) return;
      createChildMutation({ name, icon });
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

      // Hide jobs that are already in progress, waiting approval, or approved.
      const activeScheduledJobIds = new Set(
        jobInstances
          .filter(
            (i) =>
              i.childId === childId &&
              i.scheduledJobId &&
              (i.status === "in_progress" ||
                i.status === "completed" ||
                i.status === "approved")
          )
          .map((i) => i.scheduledJobId)
      );

      return todayScheduled
        .filter((s) => !activeScheduledJobIds.has(s._id))
        .map((s) => {
          const rejectedInstance = jobInstances
            .filter(
              (i) =>
                i.childId === childId &&
                i.scheduledJobId === s._id &&
                i.status === "rejected"
            )
            .sort((a, b) => (b.rejectedAt ?? 0) - (a.rejectedAt ?? 0))[0];

          return {
            ...s,
            parentNote: rejectedInstance?.parentNote,
            rejectionCount: rejectedInstance?.rejectionCount,
          };
        });
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

  const getLifetimeEarnings = useCallback(
    (childId: string) => {
      return jobInstances
        .filter((i) => i.childId === childId && i.status === "approved")
        .reduce((sum, i) => {
          const job = jobs.find((j) => j._id === i.jobId);
          return sum + (job?.yenAmount || 0);
        }, 0);
    },
    [jobInstances, jobs]
  );

  const getWalletsForChild = useCallback(
    (childId: string) => wallets.filter((wallet) => wallet.childId === childId),
    [wallets]
  );

  const getWalletBalance = useCallback(
    (childId: string, jar: WalletJar) =>
      wallets.find((wallet) => wallet.childId === childId && wallet.jar === jar)
        ?.balance ?? 0,
    [wallets]
  );

  const getWalletTotal = useCallback(
    (childId: string) =>
      wallets
        .filter((wallet) => wallet.childId === childId)
        .reduce((sum, wallet) => sum + wallet.balance, 0),
    [wallets]
  );

  const getRankForChild = useCallback(
    (childId: string): RankProgress => {
      const child = mappedChildren.find((c) => c._id === childId);
      const lifetime = getLifetimeEarnings(childId);
      const calc = calculateRank(lifetime, child?.rankMultiplier ?? 1);
      return {
        rank: calc.tier,
        nextRank: calc.nextRank ?? undefined,
        score: calc.score,
        nextScore: calc.nextTierAt ?? undefined,
        progress: calc.progressToNext,
        multiplier: calc.multiplier,
      };
    },
    [getLifetimeEarnings, mappedChildren]
  );

  const getTransactionsForChild = useCallback(
    (childId: string) =>
      transactions.filter((transaction) => transaction.childId === childId),
    [transactions]
  );

  const getGoalsForChild = useCallback(
    (childId: string) => goals.filter((goal) => goal.childId === childId),
    [goals]
  );

  const getActiveGoalForChild = useCallback(
    (childId: string) =>
      goals
        .filter((goal) => goal.childId === childId && goal.status === "active")
        .sort((a, b) => b.updatedAt - a.updatedAt)[0],
    [goals]
  );

  const getLuckyChestStatus = useCallback(
    (childId: string) =>
      (rawLuckyChestStatuses ?? []).find((status) => status.childId === childId),
    [rawLuckyChestStatuses]
  );

  const value = useMemo(
    () => ({
      isLoading,
      userId: userIdForQueries ?? null,
      captainCodeEnabled,
      luckyChestMaxAmount,
      familyChildren: mappedChildren,
      jobs,
      jobInstances,
      scheduledJobs,
      wallets,
      transactions,
      goals,
      setCaptainCodeEnabled,
      addJob,
      editJob,
      deleteJob,
      scheduleJob,
      scheduleJobBatch,
      removeScheduledJob,
      clearScheduledDay,
      applyRecurringJobsForWeek,
      quickAssign,
      quickAddForToday,
      createOneOff,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      withdrawFromWallet,
      awardBonus,
      setLuckyChestMaxAmount,
      openLuckyChest,
      createGoal,
      getScheduledJobsForChildDate,
      getScheduledJobsForWeek,
      getTodayAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getLifetimeEarnings,
      getWalletsForChild,
      getWalletBalance,
      getWalletTotal,
      getRankForChild,
      getTransactionsForChild,
      getGoalsForChild,
      getActiveGoalForChild,
      getLuckyChestStatus,
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
      captainCodeEnabled,
      luckyChestMaxAmount,
      mappedChildren,
      jobs,
      jobInstances,
      scheduledJobs,
      wallets,
      transactions,
      goals,
      setCaptainCodeEnabled,
      addJob,
      editJob,
      deleteJob,
      scheduleJob,
      scheduleJobBatch,
      removeScheduledJob,
      clearScheduledDay,
      applyRecurringJobsForWeek,
      quickAssign,
      quickAddForToday,
      createOneOff,
      startJob,
      completeJob,
      approveJob,
      rejectJob,
      withdrawFromWallet,
      awardBonus,
      setLuckyChestMaxAmount,
      openLuckyChest,
      createGoal,
      getScheduledJobsForChildDate,
      getScheduledJobsForWeek,
      getTodayAvailableJobs,
      getInProgressJobs,
      getCompletedJobs,
      getPendingApprovals,
      getWeeklyEarnings,
      getWeeklyPotential,
      getLifetimeEarnings,
      getWalletsForChild,
      getWalletBalance,
      getWalletTotal,
      getRankForChild,
      getTransactionsForChild,
      getGoalsForChild,
      getActiveGoalForChild,
      getLuckyChestStatus,
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
