package com.stockapp.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserInfo(
    UUID id,
    String name,
    String username,
    String email,
    String mobile,
    String roleName,
    Long roleId,
    boolean active,
    LocalDateTime createdTime,
    LocalDateTime updatedTime
) {}
