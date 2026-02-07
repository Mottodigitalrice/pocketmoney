import { Job, KidJobInstance } from "@/types";

export const MOCK_JOBS: Job[] = [
  { id: "job-1", title: "Fold the washing", yenAmount: 100, assignedTo: "both", dailyLimit: 1, weeklyLimit: 7, icon: "👕" },
  { id: "job-2", title: "Clean up toys", yenAmount: 50, assignedTo: "both", dailyLimit: 2, weeklyLimit: 7, icon: "🧸" },
  { id: "job-3", title: "Make the bed", yenAmount: 50, assignedTo: "both", dailyLimit: 1, weeklyLimit: 7, icon: "🛏️" },
  { id: "job-4", title: "Set the table", yenAmount: 100, assignedTo: "both", dailyLimit: 1, weeklyLimit: 7, icon: "🍽️" },
  { id: "job-5", title: "Water the plants", yenAmount: 100, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 3, icon: "🌱" },
  { id: "job-6", title: "Put shoes away", yenAmount: 50, assignedTo: "both", dailyLimit: 2, weeklyLimit: 7, icon: "👟" },
  { id: "job-7", title: "Feed the pets", yenAmount: 150, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 7, icon: "🐾" },
  { id: "job-8", title: "Put dishes in the sink", yenAmount: 50, assignedTo: "both", dailyLimit: 3, weeklyLimit: 7, icon: "🍽️" },
  { id: "job-9", title: "Pick up books", yenAmount: 50, assignedTo: "both", dailyLimit: 2, weeklyLimit: 7, icon: "📚" },
  { id: "job-10", title: "Wipe the table", yenAmount: 100, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 7, icon: "🧹" },
  { id: "job-11", title: "Dirty clothes in basket", yenAmount: 50, assignedTo: "both", dailyLimit: 2, weeklyLimit: 7, icon: "🧺" },
  { id: "job-12", title: "Tidy your room", yenAmount: 200, assignedTo: "both", dailyLimit: 1, weeklyLimit: 7, icon: "🏠" },
  { id: "job-13", title: "Help set up the futon", yenAmount: 150, assignedTo: "both", dailyLimit: 1, weeklyLimit: 7, icon: "🛋️" },
  { id: "job-14", title: "Brush teeth (no asking!)", yenAmount: 100, assignedTo: "both", dailyLimit: 2, weeklyLimit: 14, icon: "🪥" },
  { id: "job-15", title: "Pack school bag", yenAmount: 100, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 5, icon: "🎒" },
  { id: "job-16", title: "Put away groceries", yenAmount: 200, assignedTo: "both", dailyLimit: 1, weeklyLimit: 3, icon: "🛒" },
  { id: "job-17", title: "Sweep the floor", yenAmount: 200, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 3, icon: "🧹" },
  { id: "job-18", title: "Wipe windows", yenAmount: 300, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 1, icon: "🪟" },
  { id: "job-19", title: "Sort the recycling", yenAmount: 150, assignedTo: "both", dailyLimit: 1, weeklyLimit: 3, icon: "♻️" },
  { id: "job-20", title: "Help cook dinner", yenAmount: 500, assignedTo: "jayden", dailyLimit: 1, weeklyLimit: 3, icon: "👨‍🍳" },
];

export const INITIAL_JOB_INSTANCES: KidJobInstance[] = [
  // Jayden has a few jobs in progress for demo
  { id: "inst-1", jobId: "job-3", childId: "jayden", status: "in_progress", startedAt: Date.now() - 3600000 },
  { id: "inst-2", jobId: "job-7", childId: "jayden", status: "completed", startedAt: Date.now() - 7200000, completedAt: Date.now() - 3600000 },
  { id: "inst-3", jobId: "job-1", childId: "jayden", status: "approved", startedAt: Date.now() - 86400000, completedAt: Date.now() - 82800000, approvedAt: Date.now() - 79200000 },
  // Tyler has some too
  { id: "inst-4", jobId: "job-2", childId: "tyler", status: "in_progress", startedAt: Date.now() - 1800000 },
  { id: "inst-5", jobId: "job-6", childId: "tyler", status: "completed", startedAt: Date.now() - 5400000, completedAt: Date.now() - 3600000 },
  { id: "inst-6", jobId: "job-14", childId: "tyler", status: "approved", startedAt: Date.now() - 86400000, completedAt: Date.now() - 82800000, approvedAt: Date.now() - 79200000 },
];
