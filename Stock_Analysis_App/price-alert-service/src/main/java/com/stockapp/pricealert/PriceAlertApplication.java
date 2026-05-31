package com.stockapp.pricealert;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.stockapp.pricealert", "com.stockapp.common"})
@EnableScheduling
public class PriceAlertApplication {

    public static void main(String[] args) {
        SpringApplication.run(PriceAlertApplication.class, args);
    }
}
