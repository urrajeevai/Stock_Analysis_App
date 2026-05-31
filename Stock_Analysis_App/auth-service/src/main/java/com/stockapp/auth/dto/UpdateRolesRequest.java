package com.stockapp.auth.dto;

import java.util.Set;

public record UpdateRolesRequest(Set<String> roles) {}
