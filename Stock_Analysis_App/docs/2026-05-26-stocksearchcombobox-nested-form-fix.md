# 2026-05-26 — Bug Fix: "Create & Select" in StockSearchCombobox Did Not Save Stock

## Problem

Clicking "Create & Select" in the inline create-stock form inside `StockSearchCombobox`
did not call `POST /stocks` — the new stock was never created.

## Root Cause

The inline create-stock UI was rendered as a `<form>` element nested inside the outer
`<form>` element from `AnalysisForm` (and `TradeForm`):

```
<form onSubmit={handleSubmit(doSubmit)}>   ← AnalysisForm / TradeForm
  <StockSearchCombobox>
    <form onSubmit={handleCreateSubmit}>   ← create stock panel (INVALID: nested form)
      <button type="submit">Create & Select</button>
    </form>
  </StockSearchCombobox>
</form>
```

**Nested `<form>` elements are invalid HTML.** Browsers strip inner `<form>` tags from the
DOM. As a result, the "Create & Select" `type="submit"` button was adopted by the outer
form. Clicking it submitted the outer analysis/trade form — `handleCreateSubmit` was never
called, `createStock` was never invoked, and the stock was never created.

## Fix — `StockSearchCombobox.jsx` only (no backend changes)

Three changes:

1. `handleCreateSubmit` signature: `async (e) => { e.preventDefault(); … }` →
   `async () => { … }` (no event, nothing to prevent)

2. The create-stock panel wrapper: `<form onSubmit={handleCreateSubmit}>` →
   `<div>` (plain container, not a form element)

3. The "Create & Select" button:
   `type="submit"` → `type="button"` with `onClick={handleCreateSubmit}`

The `disabled` logic and all other behaviour are unchanged.

## Why Nested Forms Break

The HTML spec forbids descendant `<form>` elements. Browsers silently remove the inner
`<form>` tag from the DOM while keeping its children. Submit buttons inside the removed
form are then re-parented to the nearest ancestor form — in this case the outer
`AnalysisForm`/`TradeForm`. Pressing Enter on a field inside the inner panel had the same
effect: it submitted the outer form.

## Affected Pages

- `/analysis/new` (AnalysisForm → StockSearchCombobox)
- `/analysis/:id` edit mode (same)
- `/trades/new` (TradeForm → StockSearchCombobox)
- `/trades/:id` edit mode (same)
