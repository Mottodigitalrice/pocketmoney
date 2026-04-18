export const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const hasConvexEnv = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
export const hasAppDataEnv = hasClerkEnv && hasConvexEnv;
