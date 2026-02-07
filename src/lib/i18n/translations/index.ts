import en from "./en";
import ja from "./ja";

export type TranslationKey = keyof typeof en;
export type Locale = "en" | "ja";

export const translations: Record<Locale, Record<TranslationKey, string>> = { en, ja };
