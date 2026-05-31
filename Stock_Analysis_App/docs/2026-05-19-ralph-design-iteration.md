# Design Iteration Log — 2026-05-19

## Ralph Loop Findings

Running a full front-end audit revealed the following issues against the professional quality bar:

### What Ralph Found

**Typography & Fonts**
- Using system Inter with no fallback loading — no distinct brand identity
- Data values (prices, ratios) rendered in proportional font, reducing scannability
- Label hierarchy was weak: section titles, field labels, and body text all similar weight

**Color & Design Language**
- Sidebar active state used background fill (too heavy, felt like a toggle)  
- MetricsCard had no icons — looked like plain text boxes
- Empty states used emoji `📭` — unprofessional in a financial tool
- Badge ring/border was absent — borders made states pop vs. flat colored backgrounds

**Layout & Spacing**
- Dashboard had no greeting or date context — felt cold/generic
- Topbar had no breadcrumb navigation — disorienting on detail pages
- Tables had `bg-slate-50` header — subtle but made columns look like header rows
- Content area background was pure `#f8fafc` — too bright, lacked depth
- Sidebar width was 64 (256px) — a touch wide for the content it holds

**Interaction Quality**
- Buttons had no active press effect (`scale` transform) or brand shadows
- Form inputs had no `hover:border` state — inputs felt flat
- Loading state showed just a spinner with no context label
- TradeTable filter bar had no visual separation from main content

**Mobile**
- Sidebar overlay backdrop had no blur — felt abrupt
- Mobile overlay was thin bg-black/50 — not enough visual separation

### What Was Improved (Round 1)

**Design System Foundation**
- Added `DM Sans` (Google Fonts) — modern, humanist, professional financial feel
- Added `JetBrains Mono` for all numeric/data values via `.font-data` class
- Created CSS custom properties for design tokens in `index.css`
- Added `.card`, `.section-heading`, `.label-xs`, `.segmented-control` component classes
- Tailwind config extended with `brand.*` color scale, `shadow-card`, `shadow-brand-*`
- Added `animate-fade-in` and `animate-slide-in` keyframe animations

**Layout & Navigation**
- Sidebar: Active state now uses left-border indicator (3px indigo line) + text color only — no background fill
- Sidebar: New logo — indigo rounded square with chart SVG + "Trade Journal" subtitle
- Sidebar: Reduced width to 240px; subtler dark navy gradient bg  
- Sidebar: User section has indigo-tinted avatar ring
- Topbar: Full breadcrumb navigation (single-level with back links)
- Topbar: Notification dot replaces number badge (cleaner)
- AppLayout: Content bg changed to `#f0f4f8` (warm-cool balance)
- Mobile overlay gets `backdrop-blur-sm`

**Login Page** (most impactful change)
- Full split-panel layout: Left 52% dark navy brand panel / Right 48% white form
- Brand panel: grid-pattern overlay, centered glow, tagline, feature list with icon chips
- Form panel: card with proper shadow, "Welcome back" copy, hint text for admin creds
- Responsive: stacks on mobile with just the logo shown

**Dashboard**
- Greeting header: "Good morning/afternoon/evening, [FirstName] 👋" with current date
- Action buttons: use `leftIcon` prop for `PlusIcon` / `DocumentChartBarIcon`
- MetricsCard: icon slot, accent color system, `font-data` on values, trend prop
- Dashboard metrics use icons: ArrowTrendingUp, Trophy, Scale, ArrowPath
- Section headers: proper `section-heading` class + "View all →" link pattern
- Alerts section only shown when alerts exist (no empty box)

**UI Primitives**
- Button: `shadow-brand-sm` on primary, `active:scale-[0.97]` press effect, `xs` size added
- Badge: Added `dot` prop for status indicator, ring border, `brand` variant
- Input: `hover:border-slate-300`, ring uses brand color, `hint` prop added
- Select: Same improvements as Input
- EmptyState: SVG icons (InboxIcon, TradeIcon, AlertIcon) replace emoji
- Spinner: `xs` size, `aria-label="Loading"` for accessibility
- Modal: `backdrop-blur-[2px]`, `rounded-2xl`, improved close button

**Tables**
- TradeTable: `label-xs` headers, right-aligned price columns, `.font-data` on numbers
- TradeTable: `dot` badges on status, `group-hover:text-brand` on ticker
- AnalysisTable: Same treatment
- AlertList: Consistent with TradeTable styling
- SetupTable: `font-data` on numbers, `replace(/_/g, ' ')` on setup names

**Forms**
- TradeForm: Two-column layout for ticker/direction, better R/R preview card
- AnalysisForm: Two-column layout, cleaner textarea
- All form pages: card wrapper with title + subtitle description

**Performance Page**
- Segmented control uses new `.segmented-control` class
- Chart containers have subtitle descriptions
- Chart cards use `.card` class with consistent padding

**Detail Pages**  
- TradeDetailPage: Back button, `DetailItem` component for grid cells
- AnalysisDetailPage: Back button, thesis in `bg-slate-50` block, outcome buttons with icons
- Both: `animate-fade-in` entry animation

### Frontend-Design Skill Verification

Quality verified against the following criteria:

✅ **Real product feel** — Split login, breadcrumbs, greeting, JetBrains Mono for data  
✅ **Clean layout, consistent spacing** — CSS component classes enforce spacing consistency  
✅ **Professional color palette** — Indigo brand with success/danger/warning semantic tokens  
✅ **Good typography** — DM Sans body + JetBrains Mono data, proper weight hierarchy  
✅ **Intuitive to use** — Breadcrumbs, back buttons, clear CTAs, section headers  
✅ **Well-arranged** — Card-based layout, consistent table patterns, grid forms  
✅ **Desktop & mobile** — Responsive sidebar overlay, stacked login on mobile  
✅ **Small details** — Loading states with context text, empty states with SVGs, dot badges  
✅ **Smooth interactions** — Button press scale, hover borders, sidebar transition  
✅ **Error messages** — Consistent `bg-red-50 border-red-200` card treatment  

### Files Changed

- `frontend/src/index.css` — Design tokens, font import, component classes
- `frontend/tailwind.config.js` — Extended color scale, fonts, shadows, animations
- `frontend/src/components/ui/Button.jsx` — Shadows, active states, xs size
- `frontend/src/components/ui/Badge.jsx` — Dot prop, ring borders, brand variant  
- `frontend/src/components/ui/Input.jsx` — Hover states, hint prop
- `frontend/src/components/ui/Select.jsx` — Matching Input improvements
- `frontend/src/components/ui/EmptyState.jsx` — SVG icons replacing emoji
- `frontend/src/components/ui/Spinner.jsx` — xs size, accessibility
- `frontend/src/components/ui/Modal.jsx` — Blur backdrop, rounded-2xl
- `frontend/src/components/layout/Sidebar.jsx` — Left-border active, new logo
- `frontend/src/components/layout/Topbar.jsx` — Breadcrumb navigation
- `frontend/src/components/layout/AppLayout.jsx` — New bg, blur overlay
- `frontend/src/components/performance/MetricsCard.jsx` — Icon slot, accent, trend
- `frontend/src/components/performance/SetupTable.jsx` — font-data, label-xs
- `frontend/src/components/trades/TradeTable.jsx` — label-xs, font-data, dot badges
- `frontend/src/components/trades/TradeForm.jsx` — Two-column layout, cleaner
- `frontend/src/components/trades/RevisionTimeline.jsx` — Refined timeline
- `frontend/src/components/analysis/AnalysisTable.jsx` — Consistent with TradeTable
- `frontend/src/components/analysis/AnalysisForm.jsx` — Two-column layout
- `frontend/src/components/alerts/AlertList.jsx` — Consistent table treatment
- `frontend/src/pages/LoginPage.jsx` — Full split-panel redesign
- `frontend/src/pages/RegisterPage.jsx` — Matches login branding
- `frontend/src/pages/DashboardPage.jsx` — Greeting, icons, metrics
- `frontend/src/pages/TradesPage.jsx` — animate-fade-in, max-width
- `frontend/src/pages/NewTradePage.jsx` — card wrapper, subtitle
- `frontend/src/pages/TradeDetailPage.jsx` — back button, DetailItem component
- `frontend/src/pages/AnalysisPage.jsx` — animate-fade-in
- `frontend/src/pages/NewAnalysisPage.jsx` — card wrapper, subtitle
- `frontend/src/pages/AnalysisDetailPage.jsx` — back button, thesis block
- `frontend/src/pages/PerformancePage.jsx` — Icons, segmented control, descriptions
- `frontend/src/pages/AlertsPage.jsx` — Segmented control with new classes
- `frontend/src/pages/StocksPage.jsx` — Search with icon, ghost action buttons
- `frontend/src/pages/AdminPage.jsx` — Consistent table, ghost actions
- `frontend/src/pages/RolesPage.jsx` — Role descriptions, consistent table
