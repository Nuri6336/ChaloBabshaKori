package com.chalobabshakori.service;

import com.chalobabshakori.domain.AppUser;
import com.chalobabshakori.domain.Business;
import com.chalobabshakori.repo.BusinessRepository;
import com.chalobabshakori.repo.UserRepository;
import com.chalobabshakori.security.JwtService;
import com.chalobabshakori.web.ApiException;
import com.chalobabshakori.web.dto.Dtos.AuthResponse;
import com.chalobabshakori.web.dto.Dtos.LoginRequest;
import com.chalobabshakori.web.dto.Dtos.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final BusinessRepository businesses;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, BusinessRepository businesses, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.businesses = businesses;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        Business business = new Business();
        business.setName(req.businessName().trim());
        business.setPhone(req.phone());
        business = businesses.save(business);

        AppUser user = new AppUser();
        user.setBusinessId(business.getId());
        user.setName(req.ownerName().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(AppUser.Role.OWNER);
        user = users.save(user);
        return response(user, business);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        AppUser user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        Business business = businesses.findById(user.getBusinessId()).orElseThrow();
        return response(user, business);
    }

    @Transactional(readOnly = true)
    public AuthResponse me(Long userId) {
        AppUser user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        Business business = businesses.findById(user.getBusinessId()).orElseThrow();
        return response(user, business);
    }

    private AuthResponse response(AppUser u, Business b) {
        return new AuthResponse(jwt.issue(u), u.getId(), u.getName(), u.getEmail(), u.getRole().name(),
                b.getId(), b.getName());
    }
}
