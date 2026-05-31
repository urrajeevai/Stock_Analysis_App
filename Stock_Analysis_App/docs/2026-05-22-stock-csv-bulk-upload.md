# 2026-05-22 — Stock Master Data: CSV Bulk Upload (Upsert)

## Why

Manually adding stocks one by one is impractical when the user has hundreds of NSE stocks to import.
NSE provides a bulk ISIN download in CSV format with columns: Company Name, Industry, Symbol, Series, ISIN Code.
This feature lets the user upload that file directly to populate or refresh the stock master data in one step.

---

## What Changed

### Stock Entity — 3 new fields

| Column | Type | Notes |
|---|---|---|
| `industry` | VARCHAR(200), nullable | e.g. "Oil & Gas", "Information Technology" |
| `series` | VARCHAR(20), nullable | NSE series code, e.g. "EQ", "SME", "BE" |
| `isin_code` | VARCHAR(20), nullable | ISIN unique identifier, e.g. "INE002A01018" |

`ddl-auto: update` adds these columns automatically on startup. Existing seeded stocks get null values for the new fields — backward-compatible.

### Upsert Logic (`StockService.uploadFromCsv`)

For each CSV data row (after skipping the header):
1. Parse the row (handles quoted fields with embedded commas)
2. Skip blank rows and rows missing Symbol or Company Name (log to error list)
3. Look up stock by `UPPER(symbol)` in the DB
   - **Found → UPDATE**: overwrites `name`, `industry`, `series`, `isinCode`; sets `active = true`
   - **Not found → INSERT**: creates new stock with `exchange = "NSE"` as default
4. Catch per-row exceptions — continue processing remaining rows
5. Return `CsvUploadResult` with `inserted`, `updated`, `failed`, `total`, `errors[]`

### CSV Parser

Built-in without external library. Handles:
- Standard comma-delimited fields
- Double-quoted fields: `"Tata Consultancy Services, Ltd"` parsed as single field
- Escaped quotes inside quoted fields (`""` → `"`)

### New Endpoint

```
POST /stocks/upload-csv
Content-Type: multipart/form-data
Authorization: Bearer <token>   (ADMIN or TRADER)

Form field: file = <CSV file>

Response 200:
{
  "inserted": 42,
  "updated": 18,
  "failed": 2,
  "total": 62,
  "errors": [
    "Row 14: Symbol is blank — skipped",
    "Row 31 (XYZ): Company Name is blank — skipped"
  ]
}
```

### Backend Files Changed

- `entity/Stock.java` — added `industry`, `series`, `isinCode` fields; name max-length bumped to 200
- `dto/StockDto.java` — added `industry`, `series`, `isinCode`
- `dto/CreateStockRequest.java` — added optional `industry`, `series`, `isinCode`
- `dto/UpdateStockRequest.java` — added optional `industry`, `series`, `isinCode`
- `dto/CsvUploadResult.java` — new record
- `service/StockService.java` — `uploadFromCsv(MultipartFile)` + `parseCsvRow(String)` helper; all CRUD methods updated for new fields
- `repository/StockRepository.java` — added `findAllByOrderByNameAsc()`; extended `search()` to also match `industry` and `isinCode`
- `controller/StockController.java` — added `POST /stocks/upload-csv` endpoint

### Frontend Files Changed

- `services/stocks.js` — added `uploadStocksCsv(file)` function
- `pages/StocksPage.jsx` — major update:
  - **Upload CSV button** in the header toolbar
  - **CSV Upload Modal** with:
    - Format guide panel showing expected columns + rules
    - Template download button (generates a sample .csv client-side)
    - File picker (accepts `.csv` only)
    - Upload & Process button
    - **Result panel** showing inserted/updated/failed counts with color coding
    - Scrollable error list for failed rows
    - "Upload Another" to reset and upload again
  - **Stock table** extended with new columns: Industry, Series, ISIN Code
  - **Single stock create/edit modal** extended with Industry, Series, ISIN Code fields
  - Search now also matches Industry and ISIN Code

---

## CSV Format

```
Company Name,Industry,Symbol,Series,ISIN Code
Reliance Industries Ltd,Oil & Gas,RELIANCE,EQ,INE002A01018
Infosys Ltd,Information Technology,INFY,EQ,INE009A01021
Tata Consultancy Services Ltd,Information Technology,TCS,EQ,INE467B01029
```

- Header row is required and is always skipped
- Fields are comma-separated; quoted if they contain commas
- Exchange is not in the CSV — all new stocks get `exchange = "NSE"`
- Existing stocks matched by symbol (case-insensitive) are updated, not duplicated
