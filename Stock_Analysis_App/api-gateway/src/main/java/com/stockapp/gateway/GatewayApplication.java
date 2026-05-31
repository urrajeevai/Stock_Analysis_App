package com.stockapp.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication(
    scanBasePackages = {"com.stockapp.gateway", "com.stockapp.common"},
    exclude = {
        WebMvcAutoConfiguration.class,
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    }
)
// Exclude Servlet-based beans from common-lib that cannot run in a WebFlux context.
// JwtAuthFilter extends OncePerRequestFilter (Servlet) and GlobalExceptionHandler
// uses @RestControllerAdvice (MVC) — neither is needed in the gateway.
@ComponentScan(
    basePackages = {"com.stockapp.gateway", "com.stockapp.common"},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.REGEX,
            pattern = "com\\.stockapp\\.common\\.security\\.JwtAuthFilter"
        ),
        @ComponentScan.Filter(
            type = FilterType.REGEX,
            pattern = "com\\.stockapp\\.common\\.exception\\.GlobalExceptionHandler"
        )
    }
)
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
