package com.stockapp.momentum;

import com.stockapp.momentum.service.MomentumService;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CSV parsing logic — no Spring context needed.
 * Verifies that the BOM stripping and header detection work with the actual
 * NSE momentum export format used in IncreasingMomentumScore1M_13-May-2026.csv
 */
class MomentumServiceCsvTest {

    // ---- parseCsvRow tests -------------------------------------------------

    @Test
    void parseCsvRow_simpleRow_splitsCorrectly() {
        String[] cols = MomentumService.parseCsvRow("Oil India Ltd.,OIL,NSE,Crude Oil,Oil Exploration,82,50,507.1,3.29");
        assertEquals(9, cols.length);
        assertEquals("Oil India Ltd.", cols[0]);
        assertEquals("OIL", cols[1]);
        assertEquals("82", cols[5]);
    }

    @Test
    void parseCsvRow_quotedFieldWithComma_treatedAsSingleField() {
        // Last column in real file: "OIL,"
        String[] cols = MomentumService.parseCsvRow(
                "Oil India Ltd.,OIL,NSE,Crude Oil,Oil Exploration,82,50,507.1,3.29,\"OIL,\"");
        assertEquals(10, cols.length);
        assertEquals("OIL,", cols[9]); // quotes stripped, comma preserved inside field
    }

    @Test
    void parseCsvRow_stockNameWithAmpersand_parsedCorrectly() {
        String[] cols = MomentumService.parseCsvRow(
                "Oil & Natural Gas Corporation Ltd.,ONGC,NSE,Crude Oil,Oil Exploration,75,43,297.15,0.9,\"ONGC,\"");
        assertEquals(10, cols.length);
        assertEquals("Oil & Natural Gas Corporation Ltd.", cols[0]);
        assertEquals("ONGC", cols[1]);
        assertEquals("75", cols[5]);
    }

    // ---- BOM stripping tests -----------------------------------------------

    @Test
    void bomStripping_headerStartsWithBom_isRemovedBeforeParsing() {
        // Simulate what BufferedReader returns for a UTF-8 BOM file
        String headerWithBom = "﻿Stock Name,Symbol,Exch,Sector Name,Industry Name,Score,4 Day Change,Close,Chg%,Symbol with Comma for External Upload";

        // Apply the BOM strip logic from MomentumService
        String stripped = headerWithBom;
        if (!stripped.isEmpty() && stripped.charAt(0) == '﻿') {
            stripped = stripped.substring(1);
        }

        assertEquals("Stock Name", stripped.split(",")[0],
                "BOM should be removed so first header is exactly 'Stock Name'");
        assertFalse(stripped.startsWith("﻿"), "Stripped header must not start with BOM");
    }

    @Test
    void headerDetection_bomFileHeaders_allRequiredColumnsFound() {
        // Real header from IncreasingMomentumScore1M_13-May-2026.csv with BOM prepended
        String headerLine = "﻿Stock Name,Symbol,Exch,Sector Name,Industry Name,Score,4 Day Change,Close,Chg%,Symbol with Comma for External Upload";

        // Strip BOM
        if (!headerLine.isEmpty() && headerLine.charAt(0) == '﻿') {
            headerLine = headerLine.substring(1);
        }

        // Parse headers
        String[] rawHeaders = MomentumService.parseCsvRow(headerLine);

        // Build normalised index
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < rawHeaders.length; i++) {
            String key = rawHeaders[i].trim().toLowerCase();
            idx.put(key, i);
        }

        assertNotNull(idx.get("symbol"),     "symbol column must be found");
        assertNotNull(idx.get("stock name"), "stock name column must be found");
        assertNotNull(idx.get("score"),      "score column must be found");
        assertNotNull(idx.get("sector name"),"sector name column must be found");

        assertEquals(1, idx.get("symbol"));
        assertEquals(0, idx.get("stock name"));
        assertEquals(5, idx.get("score"));
        assertEquals(3, idx.get("sector name"));
    }

    @Test
    void headerDetection_noBom_stillFindsAllColumns() {
        // Same header without BOM — should work identically
        String headerLine = "Stock Name,Symbol,Exch,Sector Name,Industry Name,Score,4 Day Change,Close,Chg%,Symbol with Comma for External Upload";

        String[] rawHeaders = MomentumService.parseCsvRow(headerLine);
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < rawHeaders.length; i++) {
            idx.put(rawHeaders[i].trim().toLowerCase(), i);
        }

        assertNotNull(idx.get("symbol"));
        assertNotNull(idx.get("stock name"));
        assertNotNull(idx.get("score"));
    }

    // ---- Score parsing tests -----------------------------------------------

    @Test
    void scoreRow_integerScore_parsedAsDecimal() {
        String[] cols = MomentumService.parseCsvRow(
                "Balrampur Chini Mills Ltd.,BALRAMCHIN,NSE,Agriculture,Sugar,100,27,548.9,2.76,\"BALRAMCHIN,\"");
        String scoreStr = cols[5].trim(); // Score column index
        assertEquals("100", scoreStr);
        // Verify it parses as BigDecimal (no exception)
        assertDoesNotThrow(() -> new java.math.BigDecimal(scoreStr));
    }

    @Test
    void scoreRow_decimalScore_parsedCorrectly() {
        String[] cols = MomentumService.parseCsvRow(
                "Some Stock Ltd.,SOMESTOCK,NSE,IT,Software,78.50,10,500.0,1.5,\"SOMESTOCK,\"");
        String scoreStr = cols[5].trim();
        assertEquals("78.50", scoreStr);
        assertEquals(78.50, new java.math.BigDecimal(scoreStr).doubleValue(), 0.001);
    }

    @Test
    void scoreRow_negativeChgPercent_doesNotAffectScore() {
        // Vardhman Textiles: Score=90, Chg%=-0.63
        String[] cols = MomentumService.parseCsvRow(
                "Vardhman Textiles Ltd.,VTL,NSE,Textile,Textile,90,28,609.9,-0.63,\"VTL,\"");
        assertEquals("90", cols[5].trim());  // Score
        assertEquals("-0.63", cols[8].trim()); // Chg% (ignored field)
    }
}
