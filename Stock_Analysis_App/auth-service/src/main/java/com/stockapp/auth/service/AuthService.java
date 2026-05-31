package com.stockapp.auth.service;

import com.stockapp.auth.dto.*;
import com.stockapp.auth.entity.RefreshToken;
import com.stockapp.auth.entity.Role;
import com.stockapp.auth.entity.User;
import com.stockapp.auth.repository.RefreshTokenRepository;
import com.stockapp.auth.repository.RoleRepository;
import com.stockapp.auth.repository.UserRepository;
import com.stockapp.common.exception.ApiException;
import com.stockapp.common.exception.ResourceNotFoundException;
import com.stockapp.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already in use: " + request.email());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken: " + request.username());
        }

        String roleName = (request.roleName() != null && !request.roleName().isBlank())
                ? request.roleName().toUpperCase() : "TRADER";
        Role role = roleRepository.findByRoleName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setMobile(request.mobile());
        user.setRole(role);
        user.setActive(true);

        User saved = userRepository.save(user);
        String accessToken = generateAccessToken(saved);
        String refreshToken = createRefreshToken(saved.getId());
        return new AuthResponse(accessToken, refreshToken, toUserInfo(saved));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is deactivated");
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        String accessToken = generateAccessToken(user);
        String refreshToken = createRefreshToken(user.getId());
        return new AuthResponse(accessToken, refreshToken, toUserInfo(user));
    }

    @Transactional
    public AuthResponse refreshToken(String tokenValue) {
        RefreshToken rt = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (rt.isRevoked()) throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token revoked");
        if (rt.getExpiresAt().isBefore(Instant.now())) throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired");

        User user = userRepository.findById(rt.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!user.isActive()) throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is deactivated");

        return new AuthResponse(generateAccessToken(user), tokenValue, toUserInfo(user));
    }

    @Transactional
    public void logout(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    @Transactional(readOnly = true)
    public UserInfo getCurrentUser(UUID userId) {
        return toUserInfo(userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString())));
    }

    @Transactional(readOnly = true)
    public List<UserInfo> listUsers() {
        return userRepository.findAll().stream().map(this::toUserInfo).toList();
    }

    @Transactional
    public UserInfo updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        if (request.name() != null) user.setName(request.name());
        if (request.mobile() != null) user.setMobile(request.mobile());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.roleId() != null) {
            Role role = roleRepository.findById(request.roleId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Role not found: " + request.roleId()));
            user.setRole(role);
        }
        return toUserInfo(userRepository.save(user));
    }

    @Transactional
    public void updateRoles(UUID userId, java.util.Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        // Take the first role (user has single role now)
        String roleName = roleNames.iterator().next().toUpperCase();
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Role not found: " + roleName));
        user.setRole(role);
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        user.setActive(false);
        userRepository.save(user);
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
        tokens.forEach(t -> t.setRevoked(true));
        refreshTokenRepository.saveAll(tokens);
    }

    private String generateAccessToken(User user) {
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "VIEWER";
        return jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), List.of(roleName));
    }

    private String createRefreshToken(UUID userId) {
        RefreshToken rt = new RefreshToken();
        rt.setUserId(userId);
        rt.setToken(UUID.randomUUID().toString());
        rt.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        rt.setRevoked(false);
        refreshTokenRepository.save(rt);
        return rt.getToken();
    }

    public UserInfo toUserInfo(User user) {
        return new UserInfo(
                user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getMobile(),
                user.getRole() != null ? user.getRole().getRoleName() : null,
                user.getRole() != null ? user.getRole().getRoleId() : null,
                user.isActive(), user.getCreatedTime(), user.getUpdatedTime()
        );
    }
}
