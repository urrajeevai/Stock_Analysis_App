package com.stockapp.gateway.filter;

import com.stockapp.common.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Global reactive gateway filter that validates JWT tokens for all protected routes.
 *
 * Public paths (no auth required):
 *   /api/auth/login, /api/auth/register, /api/auth/refresh
 *
 * For all other paths:
 *   - Expects "Authorization: Bearer <token>" header.
 *   - On valid token: forwards request with X-User-Id and X-User-Roles headers added.
 *   - On missing / invalid token: returns 401 JSON response immediately.
 */
@Component
@RequiredArgsConstructor
public class JwtGatewayFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtGatewayFilter.class);

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh"
    );

    // GET-only public paths (stocks, roles, and analysis chart images are read-public)
    private static final List<String> PUBLIC_GET_PATHS = List.of(
            "/api/stocks",
            "/api/roles",
            "/api/analyses/images"
    );

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Allow public paths through without any auth check
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // Allow GET requests to public master-data paths (stocks, roles)
        String method = exchange.getRequest().getMethod().name();
        if ("GET".equals(method) && isPublicGetPath(path)) {
            return chain.filter(exchange);
        }

        // Extract token from Authorization header
        String token = extractToken(exchange.getRequest().getHeaders());

        if (!StringUtils.hasText(token)) {
            log.debug("Missing Authorization header for path: {}", path);
            return onError(exchange, "Missing or invalid Authorization header");
        }

        // Validate JWT
        Claims claims;
        try {
            claims = jwtTokenProvider.validateToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token for path {}: {}", path, e.getMessage());
            return onError(exchange, "Invalid or expired JWT token");
        }

        // Extract userId and roles from claims
        String userId = claims.getSubject();

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.get("roles");
        String rolesHeader = (roles != null)
                ? roles.stream().collect(Collectors.joining(","))
                : "";

        // Mutate the downstream request by adding user-identity headers
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", userId)
                .header("X-User-Roles", rolesHeader)
                .build();

        log.debug("JWT valid for user {} — forwarding to {}", userId, path);
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        // Execute before route predicates and routing filters
        return -100;
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isPublicGetPath(String path) {
        return PUBLIC_GET_PATHS.stream().anyMatch(path::startsWith);
    }

    private String extractToken(HttpHeaders headers) {
        String bearer = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    /**
     * Writes a 401 JSON response and terminates the exchange.
     */
    private Mono<Void> onError(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format(
                "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"%s\"}",
                message.replace("\"", "\\\"")
        );
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
