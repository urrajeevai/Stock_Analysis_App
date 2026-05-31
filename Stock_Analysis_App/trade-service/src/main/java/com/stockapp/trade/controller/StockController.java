package com.stockapp.trade.controller;

import com.stockapp.trade.dto.*;
import com.stockapp.trade.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Stocks", description = "Stock master data — create, search, manage, and bulk upload via CSV")
public class StockController {

    private final StockService stockService;

    @GetMapping
    @Operation(summary = "List all stocks", description = "Pass activeOnly=true to filter active only.")
    public ResponseEntity<List<StockDto>> listStocks(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(stockService.listStocks(activeOnly));
    }

    @GetMapping("/search")
    @Operation(summary = "Search stocks by name, symbol, industry, or ISIN")
    public ResponseEntity<List<StockDto>> searchStocks(@RequestParam String q) {
        return ResponseEntity.ok(stockService.searchStocks(q));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock by ID")
    public ResponseEntity<StockDto> getStock(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.getStock(id));
    }

    @GetMapping("/symbol/{symbol}")
    @Operation(summary = "Get stock by ticker symbol")
    public ResponseEntity<StockDto> getBySymbol(@PathVariable String symbol) {
        return ResponseEntity.ok(stockService.getStockBySymbol(symbol));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRADER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new stock")
    public ResponseEntity<StockDto> createStock(@Valid @RequestBody CreateStockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.createStock(request));
    }

    @PostMapping(value = "/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'TRADER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Bulk upsert stocks from CSV",
        description = "CSV must have header: Company Name,Industry,Symbol,Series,ISIN Code. " +
                      "Existing symbols are updated; new symbols are inserted. Exchange defaults to NSE."
    )
    public ResponseEntity<CsvUploadResult> uploadCsv(
            @RequestParam("file") MultipartFile file) {
        CsvUploadResult result = stockService.uploadFromCsv(file);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRADER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update stock details")
    public ResponseEntity<StockDto> updateStock(@PathVariable Long id,
                                                @RequestBody UpdateStockRequest request) {
        return ResponseEntity.ok(stockService.updateStock(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a stock (Admin only)")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }
}
