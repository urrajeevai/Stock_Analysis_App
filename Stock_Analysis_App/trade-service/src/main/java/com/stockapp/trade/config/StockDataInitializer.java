package com.stockapp.trade.config;

import com.stockapp.trade.entity.Stock;
import com.stockapp.trade.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockDataInitializer implements ApplicationRunner {

    private final StockRepository stockRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (stockRepository.count() == 0) {
            List<Stock> stocks = List.of(
                    make("Nifty 50 Index",             "NIFTY50",       "NSE"),
                    make("Sensex Index",                "SENSEX",        "BSE"),
                    make("Reliance Industries",         "RELIANCE.NS",   "NSE"),
                    make("Tata Consultancy Services",   "TCS.NS",        "NSE"),
                    make("HDFC Bank",                   "HDFCBANK.NS",   "NSE"),
                    make("Infosys",                     "INFY.NS",       "NSE"),
                    make("Wipro",                       "WIPRO.NS",      "NSE"),
                    make("ICICI Bank",                  "ICICIBANK.NS",  "NSE"),
                    make("Bajaj Finance",               "BAJFINANCE.NS", "NSE"),
                    make("Axis Bank",                   "AXISBANK.NS",   "NSE"),
                    make("Larsen & Toubro",             "LT.NS",         "NSE"),
                    make("State Bank of India",         "SBIN.NS",       "NSE"),
                    make("Maruti Suzuki",               "MARUTI.NS",     "NSE"),
                    make("Sun Pharmaceutical",          "SUNPHARMA.NS",  "NSE"),
                    make("Tata Steel",                  "TATASTEEL.NS",  "NSE"),
                    make("Asian Paints",                "ASIANPAINT.NS", "NSE"),
                    make("Kotak Mahindra Bank",         "KOTAKBANK.NS",  "NSE"),
                    make("HCL Technologies",            "HCLTECH.NS",    "NSE"),
                    make("Titan Company",               "TITAN.NS",      "NSE"),
                    make("Adani Enterprises",           "ADANIENT.NS",   "NSE"),
                    make("Apple Inc.",                  "AAPL",          "NASDAQ"),
                    make("Microsoft Corp.",             "MSFT",          "NASDAQ"),
                    make("Tesla Inc.",                  "TSLA",          "NASDAQ"),
                    make("Alphabet Inc.",               "GOOGL",         "NASDAQ"),
                    make("Amazon.com Inc.",             "AMZN",          "NASDAQ")
            );
            stockRepository.saveAll(stocks);
            log.info("Seeded {} stocks", stocks.size());
        }
    }

    private Stock make(String name, String symbol, String exchange) {
        Stock s = new Stock();
        s.setName(name);
        s.setSymbol(symbol);
        s.setExchange(exchange);
        s.setActive(true);
        return s;
    }
}
