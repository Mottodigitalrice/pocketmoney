export const APP_NAME = "PocketMoney";
export const APP_DESCRIPTION = "Earn Yen by helping around the house!";
export const APP_AUTHOR = "Mottodigital";
export const CURRENCY = "¥";

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  items: "/dashboard/items",
  settings: "/dashboard/settings",
  parent: "/parent",
  kid: (childId: string) => `/kid/${childId}`,
} as const;

export const CHILDREN = {
  jayden: { id: "jayden", name: "Jayden", age: 7, creature: "shark" },
  tyler: { id: "tyler", name: "Tyler", age: 4, creature: "dolphin" },
} as const;
