"use client";

import { useMemo, type ReactNode } from "react";
import { loadDefaultJapaneseParser } from "budoux";
import { useTranslation } from "@/hooks/use-translation";

// Module-scope singleton so the BudouX parser model (~15KB) only loads once
// per browser session, no matter how many <BudouXText> instances mount.
let parserSingleton: ReturnType<typeof loadDefaultJapaneseParser> | null = null;
function getParser() {
  if (!parserSingleton) parserSingleton = loadDefaultJapaneseParser();
  return parserSingleton;
}

interface BudouXTextProps {
  /**
   * Explicit string input. If omitted, the component reads its single string
   * child instead. Either `text` or a string child must be provided.
   */
  text?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Wraps a Japanese string with BudouX phrase-aware line breaking.
 *
 * - In EN locale: renders the text as-is (zero overhead).
 * - In JA locale: parses the string into 文節 phrases and wraps each in an
 *   `inline-block` span so the browser only breaks BETWEEN phrases — never
 *   mid-compound-word, never separating a particle from its verb.
 *
 * Per `.claude/skills/japanese-typography/SKILL.md`, the `display: inline-block`
 * pattern is preferred over `<wbr>` because it gives us a hard guarantee that
 * the browser cannot break inside a phrase, even when `word-break: auto-phrase`
 * is unsupported (Safari, Firefox).
 *
 * Usage:
 *   <BudouXText>{t("onboarding_welcome_subtitle")}</BudouXText>
 *   <BudouXText text={t("goal_swap_reassurance", { name, amount })} />
 */
export function BudouXText({ text, children, className }: BudouXTextProps) {
  const { locale } = useTranslation();

  // Resolve the source string from either `text` prop or a string child.
  const source = useMemo<string | null>(() => {
    if (typeof text === "string") return text;
    if (typeof children === "string") return children;
    return null;
  }, [text, children]);

  // EN locale, non-string children, or trivially short strings: passthrough.
  if (locale !== "ja" || source == null || source.length < 4) {
    return className ? (
      <span className={className}>{children ?? source}</span>
    ) : (
      <>{children ?? source}</>
    );
  }

  return (
    <span
      className={className}
      style={{
        // `keep-all` here prevents the outer browser from breaking inside any
        // CJK run that BudouX has NOT wrapped (defense-in-depth for short
        // sequences). `overflow-wrap: break-word` is the safety net for any
        // single phrase that exceeds the container width.
        wordBreak: "keep-all",
        overflowWrap: "break-word",
      }}
    >
      {renderPhrases(source)}
    </span>
  );
}

function renderPhrases(text: string): ReactNode {
  // Honor explicit \n line breaks before phrase segmentation — \n in JA copy
  // is a deliberate authoring decision and must outrank BudouX's guesses.
  if (text.includes("\n")) {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => (
      <span key={`line-${lineIdx}`}>
        {lineIdx > 0 && <br />}
        {renderPhrases(line)}
      </span>
    ));
  }

  const phrases = getParser().parse(text);
  if (phrases.length <= 1) return text;

  return phrases.map((phrase, i) => (
    <span
      key={i}
      style={{
        display: "inline-block",
        maxWidth: "100%",
        overflowWrap: "break-word",
      }}
    >
      {phrase}
    </span>
  ));
}
