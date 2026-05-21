/**
 * Pure overdraft predicate — NO Convex imports.
 *
 * Mirrors the throw in `transactions.withdraw`. The frontend (F12) will
 * pattern-match the `OVERDRAFT:` prefix, so the exact format below is a
 * contract. Don't reword without updating the consumer.
 *
 * Returns the structured error message when the withdrawal would
 * overdraw, or `null` if the withdrawal is OK.
 */
export function overdraftErrorOrNull(
  balance: number,
  amount: number,
): string | null {
  if (balance < amount) {
    return `OVERDRAFT: balance ¥${balance} cannot cover withdrawal ¥${amount}`;
  }
  return null;
}

export const OVERDRAFT_PREFIX = "OVERDRAFT:" as const;
