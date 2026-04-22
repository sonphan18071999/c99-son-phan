import React, { useMemo } from 'react';
import { BoxProps } from '@mui/material'; // assumed peer dependency

// ─── [FIX #1] Use an enum for blockchain names instead of `any` ───────────────
// Original: getPriority(blockchain: any) — loses type safety entirely.
// Enum makes the domain explicit, enables exhaustive checks, and prevents typos.
enum Blockchain {
  Osmosis = 'Osmosis',
  Ethereum = 'Ethereum',
  Arbitrum = 'Arbitrum',
  Zilliqa = 'Zilliqa',
  Neo = 'Neo',
}

// ─── [FIX #2] Add `blockchain` to WalletBalance ──────────────────────────────
// Original: `blockchain` field was accessed (balance.blockchain) but never
// declared in the interface, causing a silent TypeScript error.
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

// ─── [FIX #3] Extend WalletBalance instead of redeclaring shared fields ───────
// Original: FormattedWalletBalance duplicated `currency` and `amount` — a DRY
// violation that risks the two interfaces drifting out of sync.
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

// ─── [FIX #4] Move getPriority outside the component ─────────────────────────
// Original: the function was defined inside the component body, causing it to be
// re-created on every render even though it depends on no state or props.
// A lookup map is also O(1) vs O(n) for a switch statement.
const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  [Blockchain.Ethereum]: 50,
  [Blockchain.Arbitrum]: 30,
  [Blockchain.Zilliqa]: 20,
  [Blockchain.Neo]: 20,
};

const UNKNOWN_PRIORITY = -99;
const DECIMAL_PLACES = 2;

function getPriority(blockchain: Blockchain): number {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? UNKNOWN_PRIORITY;
}

const WalletPage: React.FC<Props> = (props: Props) => {
  // ─── [FIX #5] Remove unused `children` destructure ─────────────────────────
  // Original: `children` was destructured but never rendered or referenced,
  // which silently drops any child nodes passed by the parent.
  const { ...rest } = props;

  const balances = useWalletBalances();
  const prices = usePrices();

  // ─── [FIX #6] Remove `prices` from the dependency array ───────────────────
  // Original: `prices` appeared in the deps array but was never read inside the
  // memo callback, causing unnecessary recalculations whenever prices changed.
  //
  // ─── [FIX #7] Fix the undeclared `lhsPriority` reference ──────────────────
  // Original: `const balancePriority = getPriority(…)` was declared but then
  // `lhsPriority` (undefined variable) was used in the condition — a runtime
  // ReferenceError. Changed to use the correctly named `balancePriority`.
  //
  // ─── [FIX #8] Correct the filter predicate ────────────────────────────────
  // Original: the filter kept balances with `amount <= 0`, i.e. empty/negative
  // balances — the opposite of the intended behaviour. Changed to `amount > 0`.
  //
  // ─── [FIX #9] Handle the equal-priority case in sort ──────────────────────
  // Original: the comparator returned `undefined` when priorities were equal,
  // producing non-deterministic ordering. Added an explicit `return 0`.
  const sortedBalances = useMemo<WalletBalance[]>(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain); // FIX #7
        return balancePriority > UNKNOWN_PRIORITY && balance.amount > 0; // FIX #8
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority; // descending
        }
        return 0; // FIX #9 — explicit tie-break
      });
  }, [balances]); // FIX #6 — `prices` removed

  // ─── [FIX #10] Merge formatting into a single pass & actually use it ───────
  // Original: `formattedBalances` was computed but the `rows` variable still
  // iterated over `sortedBalances`, so `balance.formatted` was always undefined.
  // Additionally, `toFixed()` with no argument returns an integer string; a
  // precision constant is used here for clarity.
  const formattedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      sortedBalances.map((balance: WalletBalance) => ({
        ...balance,
        formatted: balance.amount.toFixed(DECIMAL_PLACES),
      })),
    [sortedBalances],
  );

  // ─── [FIX #11] Iterate formattedBalances (not sortedBalances) ─────────────
  // Original: `rows` mapped over `sortedBalances` while typing each element as
  // `FormattedWalletBalance` — a lie to the type system that hid the missing
  // `formatted` field.
  //
  // ─── [FIX #12] Use a stable, unique key instead of array index ─────────────
  // Original: `key={index}` is an anti-pattern; if the list reorders React
  // cannot reconcile correctly, leading to stale UI and broken animations.
  // `currency` is a natural stable identifier for a wallet balance.
  //
  // ─── [FIX #13] Remove reference to undeclared `classes` ───────────────────
  // Original: `className={classes.row}` referenced a `classes` object that was
  // never imported or created, causing a runtime ReferenceError.
  const rows = useMemo(
    () =>
      formattedBalances.map((balance: FormattedWalletBalance) => {
        const usdValue = prices[balance.currency] * balance.amount;
        return (
          <WalletRow
            key={balance.currency} // FIX #12
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.formatted} // FIX #11 — now actually defined
          />
        );
      }),
    [formattedBalances, prices],
  );

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
