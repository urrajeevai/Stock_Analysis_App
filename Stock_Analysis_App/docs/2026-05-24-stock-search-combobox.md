# 2026-05-24 — Analysis Form: Searchable Stock Combobox with Inline Create

## What Changed

### New component — `StockSearchCombobox.jsx`

Created `frontend/src/components/analysis/StockSearchCombobox.jsx` to replace the
static `<Select>` dropdown in `AnalysisForm`. The old dropdown loaded the entire stock
list on page mount (100+ rows rendered as `<option>` elements) with no search support.

#### Features

**Searchable lookup**
- Text input with a search icon
- Debounced (300 ms) call to `GET /stocks/search?q=...` after ≥ 2 characters are typed
- Results show symbol, company name, and exchange badge in a floating dropdown
- Keyboard navigation: ↑ ↓ to move, Enter to select, Escape to close
- Highlighted row tracks mouse hover too (both work simultaneously)
- Loading spinner replaces the clear (✕) button while the API call is in flight

**Paste support**
- The search field is a plain `<input type="text">` — Ctrl+V / ⌘V paste works natively
- The `onChange` handler fires on paste and the debounced search triggers automatically
- No special paste handler needed; the hint text informs users this works

**"Create new stock" inline form**
- A "Not in the list? Create a new stock" link appears at the bottom of the results
- If the search returns zero matches, an "Add … as a new stock" button is shown instead
- Clicking either opens an inline panel (animated slide-in) with fields:
  - **Symbol** (required, pre-filled from the search query, auto-uppercased)
  - **Exchange** (NSE / BSE / NASDAQ / NYSE / OTHER — default NSE)
  - **Company Name** (required)
  - **Industry** (optional)
- Submit calls `POST /stocks` — the new stock is saved to the master list
- On success the new stock is immediately selected and the combobox shows its display name
- The "Create" option is only shown when `canCreate = true` (ADMIN / TRADER role)

**Auto-fill on selection**
- Selecting a result sets both `stockId` (hidden form field) and `ticker` in the
  react-hook-form state, so the Ticker Symbol input below is filled automatically
- User can still override the ticker manually after auto-fill

**Click-outside / Escape**
- A `mousedown` listener on `document` closes the dropdown when clicking outside
- Escape key closes the dropdown from the keyboard

### Changes to `AnalysisForm.jsx`

- Removed `listStocks` import and the `stocks` state + its `useEffect` (no more full list fetch)
- Removed `handleStockSelect` (old `<Select>` change handler)
- Added `StockSearchCombobox` import
- Replaced `<Select label="Stock">` + `stocks.map(…)` + hidden stockId input with:
  ```jsx
  <StockSearchCombobox
    initialValue={defaultValues.ticker || ''}
    onChange={handleStockSelect}
    canCreate={canEdit}
  />
  <input type="hidden" {...register('stockId')} />
  ```
- `initialValue` pre-fills the combobox with the existing ticker when editing an analysis

### No backend changes

All APIs already existed:
- `GET /stocks/search?q=` — searches name, symbol, industry, ISIN (case-insensitive LIKE)
- `POST /stocks` — creates a new stock (requires ADMIN or TRADER role)

## Why

The old `<Select>` dropdown required scrolling through 100+ stocks to find one, had no
search, and gave no escape hatch when a stock was missing from the master list. Users
had to navigate away to the Stocks page to add a new stock, then return and re-start the
analysis form. The new combobox keeps everything on one page.
