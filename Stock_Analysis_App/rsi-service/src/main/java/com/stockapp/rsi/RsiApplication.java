package com.stockapp.rsi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication(scanBasePackages = {"com.stockapp.rsi", "com.stockapp.common"})
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class RsiApplication {
    public static void main(String[] args) {
        SpringApplication.run(RsiApplication.class, args);
    }
}
