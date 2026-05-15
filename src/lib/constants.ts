import { ChildIcon } from "@/types";

export const APP_NAME = "Pirate Money";
export const APP_DESCRIPTION = "Earn Yen by helping around the house!";
export const APP_AUTHOR = "Mottodigital";
export const CURRENCY = "¥";

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  onboarding: "/onboarding",
  parent: "/parent",
  kid: (childId: string) => `/kid/${childId}`,
} as const;

// Available icons for child profiles
export const CHILD_ICON_CONFIG: Record<
  ChildIcon,
  {
    label: string;
    labelJa: string;
    emoji: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  shark: {
    label: "Shark",
    labelJa: "サメ",
    emoji: "🦈",
    bgColor: "bg-blue-800/80",
    borderColor: "border-blue-400",
  },
  dolphin: {
    label: "Dolphin",
    labelJa: "イルカ",
    emoji: "🐬",
    bgColor: "bg-cyan-700/80",
    borderColor: "border-cyan-400",
  },
  turtle: {
    label: "Sea Turtle",
    labelJa: "ウミガメ",
    emoji: "🐢",
    bgColor: "bg-green-700/80",
    borderColor: "border-green-400",
  },
  octopus: {
    label: "Octopus",
    labelJa: "タコ",
    emoji: "🐙",
    bgColor: "bg-purple-700/80",
    borderColor: "border-purple-400",
  },
  starfish: {
    label: "Starfish",
    labelJa: "ヒトデ",
    emoji: "⭐",
    bgColor: "bg-amber-700/80",
    borderColor: "border-amber-400",
  },
  whale: {
    label: "Whale",
    labelJa: "クジラ",
    emoji: "🐋",
    bgColor: "bg-indigo-700/80",
    borderColor: "border-indigo-400",
  },
  crab: {
    label: "Crab",
    labelJa: "カニ",
    emoji: "🦀",
    bgColor: "bg-red-700/80",
    borderColor: "border-red-400",
  },
  fish: {
    label: "Fish",
    labelJa: "サカナ",
    emoji: "🐟",
    bgColor: "bg-teal-700/80",
    borderColor: "border-teal-400",
  },
};

// Default jobs to seed for new families (library templates)
export const DEFAULT_JOBS = [
  { title: "Fold the washing", titleKey: "job_fold_washing", yenAmount: 100, icon: "👕" },
  { title: "Clean up toys", titleKey: "job_clean_toys", yenAmount: 50, icon: "🧸" },
  { title: "Make the bed", titleKey: "job_make_bed", yenAmount: 50, icon: "🛏️" },
  { title: "Set the table", titleKey: "job_set_table", yenAmount: 100, icon: "🍽️" },
  { title: "Water the plants", titleKey: "job_water_plants", yenAmount: 100, icon: "🌱" },
  { title: "Put shoes away", titleKey: "job_put_shoes_away", yenAmount: 50, icon: "👟" },
  { title: "Feed the pets", titleKey: "job_feed_pets", yenAmount: 150, icon: "🐾" },
  { title: "Put dishes in the sink", titleKey: "job_dishes_sink", yenAmount: 50, icon: "🍽️" },
  { title: "Pick up books", titleKey: "job_pick_books", yenAmount: 50, icon: "📚" },
  { title: "Wipe the table", titleKey: "job_wipe_table", yenAmount: 100, icon: "🧹" },
  { title: "Dirty clothes in basket", titleKey: "job_dirty_clothes", yenAmount: 50, icon: "🧺" },
  { title: "Tidy your room", titleKey: "job_tidy_room", yenAmount: 200, icon: "🏠" },
  { title: "Help set up the futon", titleKey: "job_setup_futon", yenAmount: 150, icon: "🛋️" },
  { title: "Brush teeth (no asking!)", titleKey: "job_brush_teeth", yenAmount: 100, icon: "🪥" },
  { title: "Pack school bag", titleKey: "job_pack_school_bag", yenAmount: 100, icon: "🎒" },
  { title: "Put away groceries", titleKey: "job_put_away_groceries", yenAmount: 200, icon: "🛒" },
  { title: "Sweep the floor", titleKey: "job_sweep_floor", yenAmount: 200, icon: "🧹" },
  { title: "Wipe windows", titleKey: "job_wipe_windows", yenAmount: 300, icon: "🪟" },
  { title: "Sort the recycling", titleKey: "job_sort_recycling", yenAmount: 150, icon: "♻️" },
  { title: "Help cook dinner", titleKey: "job_help_cook", yenAmount: 500, icon: "👨‍🍳" },
] as const;

// Days of the week for the week planner
export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAYS_OF_WEEK_JA = ["月", "火", "水", "木", "金", "土", "日"] as const;
