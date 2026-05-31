package com.stockapp.performance.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PERF_SUMMARY  = "perfSummary";
    public static final String PERF_WEEKLY   = "perfWeekly";
    public static final String PERF_MONTHLY  = "perfMonthly";
    public static final String PERF_SETUPS   = "perfSetups";
    public static final String PERF_RR_DIST  = "perfRRDist";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(
                PERF_SUMMARY, PERF_WEEKLY, PERF_MONTHLY, PERF_SETUPS, PERF_RR_DIST);
        mgr.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(500));
        return mgr;
    }
}
