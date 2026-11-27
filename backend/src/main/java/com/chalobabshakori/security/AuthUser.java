package com.chalobabshakori.security;

/** Authenticated principal carried by the JWT. */
public record AuthUser(Long userId, Long businessId, String role) {}
