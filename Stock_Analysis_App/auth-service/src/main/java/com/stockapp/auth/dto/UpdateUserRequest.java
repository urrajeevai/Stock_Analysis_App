package com.stockapp.auth.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    String name,
    String mobile,
    @Size(min=6) String password,
    Long roleId
) {}
