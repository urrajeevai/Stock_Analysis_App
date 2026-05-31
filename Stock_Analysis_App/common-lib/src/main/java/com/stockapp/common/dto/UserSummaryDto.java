package com.stockapp.common.dto;

import java.util.Set;
import java.util.UUID;

public record UserSummaryDto(UUID id, String email, String username, Set<String> roles) {}
