# Analysis Enhancement — Price Levels, R/R Calculation & Chart Images

**Date:** 2026-05-19  
**Service:** analysis-service (port 8083)  
**Frontend:** AnalysisForm, AnalysisDetailPage, AnalysisTable

---

## Why

The Analysis feature only stored qualitative data (ticker, thesis, direction, setup type).
Traders needed to record quantitative price levels to make an analysis actionable — the same
way trades have entry/SL/target. Chart image uploads were added to capture the visual technical setup.

---

## What Changed

### Backend — New Entity Fields (auto-migrated via ddl-auto: update)

| Field | Type | Purpose |
|---|---|---|
| stock_price | DECIMAL(15,4) | Current price when analysis is written |
| risk_price | DECIMAL(15,4) | Stop-loss level |
| reward_price | DECIMAL(15,4) | Target level |
| timeframe | VARCHAR(50) | Chart timeframe (Daily, 1H, etc.) |
| risk_amount | DECIMAL(15,4) | Computed: |SP - RP| |
| reward_amount | DECIMAL(15,4) | Computed: |RP_target - SP| |
| risk_percent | DECIMAL(10,4) | Computed: riskAmt/SP×100 |
| reward_percent | DECIMAL(10,4) | Computed: rewardAmt/SP×100 |
| rr_ratio | DECIMAL(10,4) | Computed: rewardAmt/riskAmt |
| buy_decision | VARCHAR(5) | YES if rrRatio > 2, else NO |
| chart_image1–4 | VARCHAR(500) | Relative paths to uploaded images |

### Formulas

**LONG trade:**
- riskAmount = stockPrice − riskPrice
- rewardAmount = rewardPrice − stockPrice

**SHORT trade:**
- riskAmount = riskPrice − stockPrice
- rewardAmount = stockPrice − rewardPrice

**Common (both):**
- riskPercent = (riskAmount / stockPrice) × 100
- rewardPercent = (rewardAmount / stockPrice) × 100
- rrRatio = rewardAmount / riskAmount
- buyDecision = rrRatio > 2 ? "YES" : "NO"

Computed fields are stored in the database (not calculated on-the-fly) so they can be queried and used in future reporting.

### New API Endpoints

```
POST /api/analyses/{id}/images/{slot}   Upload chart image (slot 1–4, multipart/form-data, file param)
DELETE /api/analyses/{id}/images/{slot} Remove chart image for slot
GET /api/analyses/images/**             Serve uploaded image files (public, no JWT required)
```

### File Storage

Images stored at: `analysis-service/uploads/analyses/{analysisId}/chart{slot}.{ext}`  
Returned in response as: `/api/analyses/images/{analysisId}/chart{slot}.{ext}`  
Served via Spring `ResourceHandler` mapped to `/analyses/images/**`  
Allowed types: JPG, JPEG, PNG, WEBP (max 10MB per file, 40MB per request)

### application.yml additions

```yaml
spring.servlet.multipart.enabled: true
spring.servlet.multipart.max-file-size: 10MB
spring.servlet.multipart.max-request-size: 40MB
app.upload.dir: uploads/analyses
```

### New Files

- `config/WebConfig.java` — ResourceHandler for serving uploaded images
- `uploads/analyses/` — Created at runtime when first image uploaded

### Modified Files

- `entity/Analysis.java` — 14 new fields
- `dto/AnalysisCreateRequest.java` — stockPrice, riskPrice, rewardPrice, timeframe
- `dto/AnalysisUpdateRequest.java` — + expectedDirection, stockPrice, riskPrice, rewardPrice, timeframe
- `dto/AnalysisResponse.java` — all new fields + chartImageNUrl
- `service/AnalysisService.java` — computeRR(), uploadImage(), deleteImage()
- `controller/AnalysisController.java` — two new endpoints
- `config/SecurityConfig.java` — /analyses/images/** permitted without auth

---

## Frontend Changes

**AnalysisForm.jsx**
- Price Levels section: Stock Price, Risk Price (SL), Reward Price (Target)
- Live R/R preview panel (same style as TradeForm): shows Risk Amount, Reward Amount, Risk %, Reward %, R/R Ratio, Buy Decision (green YES / red NO)
- Timeframe dropdown (1m–Monthly)
- Image upload section: 4 slots with drag-and-drop style, shows thumbnails, replace/remove on hover
- Image section only shown when analysisId is known (after save)

**NewAnalysisPage.jsx**
- After initial save, shows image upload section before navigating to detail page
- User can upload images immediately after creating the analysis

**AnalysisDetailPage.jsx**
- Price Levels section in detail card: Stock Price, Risk Price, Reward Price
- Risk/Reward section: Risk Amount (red), Reward Amount (green), R/R Ratio (colored), Buy Decision badge
- Chart Images grid: 2×2 grid, click to open full size, canEdit users see upload/remove controls

**AnalysisTable.jsx**
- Added R/R column (colored by value: green ≥3, lime ≥2, amber ≥1, red <1)
- Added Decision column (green YES badge / red NO badge)
- Added TF (timeframe) column

**services/analysis.js**
- `uploadAnalysisImage(id, slot, file)` — multipart POST
- `deleteAnalysisImage(id, slot)` — DELETE
