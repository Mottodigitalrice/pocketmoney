// Common types used across the application

export type Status = "active" | "completed" | "archived";

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  captainCodeEnabled?: boolean;
  luckyChestMaxAmount?: number;
  createdAt: number;
}

// PocketMoney types

export type ChildIcon =
  | "shark"
  | "dolphin"
  | "turtle"
  | "octopus"
  | "starfish"
  | "whale"
  | "crab"
  | "fish";

export interface Child {
  _id: string;
  userId: string;
  name: string;
  icon: ChildIcon;
  age?: number;
  rankMultiplier?: number;
  createdAt: number;
}

export interface Job {
  _id: string;
  userId: string;
  title: string;
  titleJa?: string;
  titleKey?: string;
  yenAmount: number;
  icon: string;
  isOneOff?: boolean;
  requiresPhotoProof?: boolean;
  recurrence?: JobRecurrence;
  createdAt: number;
}

export type RecurrenceType = "none" | "daily" | "weekdays" | "specificDays";

export interface JobRecurrence {
  type: RecurrenceType;
  daysOfWeek?: number[];
  priority?: JobPriority;
}

export interface ScheduledJob {
  _id: string;
  userId: string;
  jobId: string;
  childId: string;
  date: string; // "YYYY-MM-DD"
  priority?: JobPriority;
  createdAt: number;
}

export interface ScheduledJobWithJob extends ScheduledJob {
  job: Job;
  parentNote?: string;
  rejectionCount?: number;
}

export type JobStatus = "in_progress" | "completed" | "approved" | "rejected";
export type JobPriority = "mustDo" | "optional";

export type PirateRank = "Noob" | "Normal" | "Pro" | "Master" | "Hacker";

export interface RankProgress {
  rank: PirateRank;
  nextRank?: PirateRank;
  score: number;
  nextScore?: number;
  progress: number;
  multiplier: number;
}

export interface JobInstance {
  _id: string;
  userId: string;
  jobId: string;
  childId: string;
  scheduledJobId?: string;
  status: JobStatus;
  startedAt?: number;
  completedAt?: number;
  approvedAt?: number;
  rejectedAt?: number;
  rejectionCount?: number;
  parentNote?: string;
  proofStorageId?: string;
  proofFileName?: string;
  proofContentType?: string;
  proofFileSize?: number;
  proofUploadedAt?: number;
  proofDeletedAt?: number;
  proofUrl?: string | null;
  createdAt: number;
}

export interface JobInstanceWithJob extends JobInstance {
  job: Job;
}

export type WalletJar = "spend" | "save" | "give";
export type TransactionType =
  | "earning"
  | "interest"
  | "withdrawal"
  | "migration"
  | "correction"
  | "bonus"
  | "luckyChest";
export type WithdrawalReason = "cashOut" | "penalty" | "correction" | "other";

export interface Wallet {
  _id: string;
  userId: string;
  childId: string;
  jar: WalletJar;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  _id: string;
  userId: string;
  childId: string;
  walletId?: string;
  jar?: WalletJar;
  amount: number;
  type: TransactionType;
  reason?: WithdrawalReason;
  note?: string;
  jobInstanceId?: string;
  createdAt: number;
}

export interface Goal {
  _id: string;
  userId: string;
  childId: string;
  title: string;
  targetAmount: number;
  emoji: string;
  status: "active" | "completed" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface LuckyChest {
  _id: string;
  userId: string;
  childId: string;
  weekStart: string;
  amount: number;
  openedAt: number;
}

export interface LuckyChestStatus {
  childId: string;
  weekStart: string;
  unlocked: boolean;
  opened: boolean;
  openedAmount?: number;
  maxAmount: number;
  mustDoTotal: number;
  mustDoApproved: number;
}
