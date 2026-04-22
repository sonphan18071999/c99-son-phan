# c99 — Interview Solutions

Three algorithmic and frontend challenges solved in JavaScript / TypeScript + React.

---

## Problem 01 — Sum to N (Three Implementations)

**Location:** `prob01/`

**Challenge:** Provide 3 unique implementations of a function `sum_to_n(n)` that returns the summation of all integers from 1 to `n`.

| Approach | Description | Time Complexity |
|---|---|---|
| Iterative | Accumulates the total in a `for` loop | O(n) |
| Recursive | Calls itself with `n - 1` until base case | O(n) |
| Mathematical | Applies the arithmetic series formula `n * (n + 1) / 2` | O(1) |

**Example:** `sum_to_n(5) === 15`

---

## Problem 02 — Currency Swap Form

**Location:** `prob02/`

**Stack:** React + TypeScript + Vite + Ant Design

**Challenge:** Build an interactive currency swap form that allows users to swap assets from one token to another using live market prices.

**Key features:**
- Live token prices fetched from `https://interview.switcheo.com/prices.json`
- Real-time exchange rate calculation between any two supported tokens
- Token selector with icons sourced from the Switcheo token icons repository
- Input validation with user-facing error messages
- Modal displaying current market prices for all available tokens
- Responsive, visually polished UI

**Run locally:**
```bash
cd prob02
npm install
npm run dev
```

---

## Problem 03 — WalletPage Code Review & Refactor

**Location:** `prob03/`

**Challenge:** Identify all computational inefficiencies and anti-patterns in a given `WalletPage` React component (TypeScript), then provide a fully refactored version.

**13 issues identified**, grouped by severity:

| Severity | Count | Examples |
|---|---|---|
| Critical | 3 | `lhsPriority` undeclared (ReferenceError), inverted filter logic, `formattedBalances` computed but never used |
| Major | 5 | Unnecessary `prices` in `useMemo` dependency, `any` typed parameter, array index used as React key |
| Minor | 5 | Missing `blockchain` field in interface, magic numbers, redundant interface, formatting inconsistencies |

**Deliverables:**
- `ANALYSIS.md` — detailed issue breakdown with original vs. fixed code for each of the 13 problems
- `WalletPage.tsx` — fully refactored component applying all fixes
