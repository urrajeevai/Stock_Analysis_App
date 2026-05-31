package com.stockapp.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRoleRequest(@NotBlank String roleName) {}
