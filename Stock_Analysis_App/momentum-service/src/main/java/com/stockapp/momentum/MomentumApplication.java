package com.stockapp.momentum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication(scanBasePackages = {"com.stockapp.momentum", "com.stockapp.common"})
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class MomentumApplication {
    public static void main(String[] args) {
        SpringApplication.run(MomentumApplication.class, args);
    }
}
