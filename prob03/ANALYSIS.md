# WalletPage — Code Review: Issues & Fixes

> Thirteen distinct issues are identified below, grouped by severity. Each entry names the problem, shows the original code, explains why it is wrong, and shows the corrected form.

---

## 🔴 Critical Bugs (Runtime Errors / Wrong Behaviour)

---

### Issue 1 — `lhsPriority` is never declared (ReferenceError at runtime)

**Original**
```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {   // ← `lhsPriority` does not exist
```

**Problem**  
`balancePriority` is assigned on the line above, but the condition immediately references `lhsPriority` — a completely different, never-declared identifier. In strict mode this is a `ReferenceError` that crashes the component on mount. Even in sloppy mode `lhsPriority` evaluates to `undefined`, so `undefined > -99` is `false` and the filter always returns `false`, meaning every balance is removed from the list.

**Fix**  
Use the variable that was actually declared.
```ts
const balancePriority = getPriority(balance.blockchain);
if (balancePriority > UNKNOWN_PRIORITY) { … }
```

---

### Issue 2 — Filter predicate is logically inverted

**Original**
```ts
if (lhsPriority > -99) {
  if (balance.amount <= 0) {   // ← keeps ZERO / NEGATIVE balances
    return true;
  }
}
return false;
```

**Problem**  
The intent is clearly to show balances that have value. However, the condition `amount <= 0` keeps balances that are empty or negative — the exact opposite of what is wanted. Any balance with a positive amount is discarded.

**Fix**
```ts
return balancePriority > UNKNOWN_PRIORITY && balance.amount > 0;
```

---

### Issue 3 — `formattedBalances` is computed but `rows` never uses it

**Original**
```ts
const formattedBalances = sortedBalances.map((balance: WalletBalance) => ({
  ...balance,
  formatted: balance.amount.toFixed()
}));

// rows still maps over `sortedBalances`, not `formattedBalances`
const rows = sortedBalances.map((balance: FormattedWalletBalance, index) => {
  …
  formattedAmount={balance.formatted}  // ← always `undefined`
});
```

**Problem**  
`formattedBalances` is calculated (wasting CPU) and then immediately discarded. `rows` iterates the un-formatted `sortedBalances` while lying to TypeScript that each element is a `FormattedWalletBalance`. Because `formatted` was never added, `balance.formatted` is `undefined` at runtime and `formattedAmount` is silently passed as `undefined` to `WalletRow`.

**Fix**  
Iterate `formattedBalances` in the `rows` computation.
```ts
const rows = useMemo(
  () => formattedBalances.map((balance: FormattedWalletBalance) => …),
  [formattedBalances, prices],
);
```

---

### Issue 4 — `classes.row` references an object that does not exist

**Original**
```tsx
<WalletRow className={classes.row} … />
```

**Problem**  
`classes` is never imported, never created (e.g. via `makeStyles` / `useStyles`), and never defined anywhere in scope. This is a runtime `ReferenceError`.

**Fix**  
Either import/create the `classes` object, pass a plain string class name, or remove the prop entirely until styling is needed.

---

## 🟠 Type Safety Issues

---

### Issue 5 — `blockchain` parameter typed as `any`

**Original**
```ts
const getPriority = (blockchain: any): number => { … }
```

**Problem**  
`any` disables all type checking for this parameter. A caller can pass a number, `null`, or a mis-spelled string and TypeScript will not warn. This also forfeits exhaustiveness checking in the switch.

**Fix**  
Declare an enum for all supported blockchains and use it as the parameter type. Additionally, replace the `switch` with a lookup map for O(1) access.
```ts
enum Blockchain { Osmosis = 'Osmosis', Ethereum = 'Ethereum', … }

const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  …
};

function getPriority(blockchain: Blockchain): number {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? UNKNOWN_PRIORITY;
}
```

---

### Issue 6 — `WalletBalance` does not declare `blockchain`

**Original**
```ts
interface WalletBalance {
  currency: string;
  amount: number;
  // `blockchain` is missing
}
```

**Problem**  
`balance.blockchain` is accessed throughout the component, but the field is absent from the interface. TypeScript should surface an error here; if it does not (e.g. because `getPriority` accepted `any`), the access is silently typed as `any`, hiding bugs.

**Fix**
```ts
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}
```

---

### Issue 7 — `FormattedWalletBalance` duplicates `WalletBalance` fields

**Original**
```ts
interface FormattedWalletBalance {
  currency: string;  // duplicated
  amount: number;    // duplicated
  formatted: string;
}
```

**Problem**  
This violates the DRY principle. If `WalletBalance` gains or renames a field, `FormattedWalletBalance` must be updated manually. The two interfaces can silently drift out of sync.

**Fix**
```ts
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}
```

---

## 🟡 Performance / Re-render Issues

---

### Issue 8 — `getPriority` is re-created on every render

**Original**
```ts
const WalletPage: React.FC<Props> = (props) => {
  …
  const getPriority = (blockchain: any): number => { … };  // inside component
```

**Problem**  
Functions defined inside a component body are re-created on every render. `getPriority` is a pure utility that depends on no state or props; allocating a new closure for it on every render is wasteful, and it can also invalidate downstream `useCallback`/`useMemo` dependencies.

**Fix**  
Move it to module scope (or define it once as a module-level constant).

---

### Issue 9 — `prices` in `useMemo` deps but not used inside

**Original**
```ts
const sortedBalances = useMemo(() => {
  return balances.filter(…).sort(…);
}, [balances, prices]);  // ← `prices` is not read inside
```

**Problem**  
Listing `prices` as a dependency causes `sortedBalances` to be recomputed every time prices update, even though prices have no effect on sorting or filtering. This propagates unnecessary recalculations down to `formattedBalances` and `rows`.

**Fix**
```ts
}, [balances]);  // only the actual dependency
```

---

### Issue 10 — Sort comparator returns `undefined` for equal priorities

**Original**
```ts
.sort((lhs, rhs) => {
  if (leftPriority > rightPriority) return -1;
  else if (rightPriority > leftPriority) return 1;
  // falls off the end — returns `undefined`
});
```

**Problem**  
When two items have equal priority, the comparator implicitly returns `undefined`. The sort specification requires a number; `undefined` is coerced to `NaN`, producing non-deterministic ordering that varies across JavaScript engines and can lead to an infinite loop in some V8 versions.

**Fix**
```ts
if (leftPriority !== rightPriority) {
  return rightPriority - leftPriority;
}
return 0;
```

---

### Issue 11 — `rows` is recomputed on every render without `useMemo`

**Original**
```ts
const rows = sortedBalances.map((balance, index) => { … });
```

**Problem**  
Without `useMemo`, a new `rows` array (and new JSX elements) is allocated on every render, even when neither `formattedBalances` nor `prices` has changed.

**Fix**
```ts
const rows = useMemo(
  () => formattedBalances.map((balance) => { … }),
  [formattedBalances, prices],
);
```

---

## 🔵 Code Quality / Anti-Patterns

---

### Issue 12 — Array index used as `key`

**Original**
```tsx
const rows = sortedBalances.map((balance, index) => (
  <WalletRow key={index} … />
));
```

**Problem**  
React uses `key` to match elements between renders. When the list order changes (which it does after sorting), index-based keys cause React to reuse the wrong DOM nodes — leading to stale UI, broken animations, and subtle state bugs inside child components.

**Fix**  
Use a stable, unique domain identifier. `currency` is a natural candidate.
```tsx
<WalletRow key={balance.currency} … />
```

---

### Issue 13 — `children` is destructured but never used

**Original**
```ts
const { children, ...rest } = props;
```

**Problem**  
`children` is pulled out of `props` and then never rendered or referenced. This silently swallows any child nodes that a parent might pass to `<WalletPage>`, and it is misleading — a reader would expect `children` to appear somewhere in the JSX.

**Fix**  
Remove the destructure if children are not needed, or render `{children}` inside the returned JSX if they should be supported.
```ts
const { ...rest } = props;
```

---

## Summary Table

| # | Category | Issue | Severity |
|---|----------|-------|----------|
| 1 | Bug | `lhsPriority` undeclared — ReferenceError 
| 2 | Bug | Filter predicate inverted — all valid balances dropped 
| 3 | Bug | `formattedBalances` computed but never used in `rows` 
| 4 | Bug | `classes.row` references an undeclared object 
| 5 | Type Safety | `blockchain` typed as `any` 
| 6 | Type Safety | `blockchain` field missing from `WalletBalance` interface 
| 7 | Type Safety | `FormattedWalletBalance` duplicates parent fields instead of extending 
| 8 | Performance | `getPriority` recreated on every render
| 9 | Performance | `prices` in `useMemo` deps but unused inside callback
| 10 | Performance | Sort comparator returns `undefined` for equal priorities
| 11 | Performance | `rows` computed without `useMemo`
| 12 | Anti-pattern | Array index used as React `key` 
| 13 | Anti-pattern | `children` destructured but never rendered 
