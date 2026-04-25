package com.internship.backend.service;

import com.internship.backend.dto.AuthResponse;
import com.internship.backend.dto.LoginRequest;
import com.internship.backend.dto.RegisterRequest;
import com.internship.backend.entity.Role;
import com.internship.backend.entity.User;
import com.internship.backend.repository.RoleRepository;
import com.internship.backend.repository.UserRepository;
import com.internship.backend.security.JwtUtil;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService implements UserDetailsService {

    private final UserRepository    userRepo;
    private final RoleRepository    roleRepo;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;

    public AuthService(UserRepository userRepo,
                       RoleRepository roleRepo,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepo        = userRepo;
        this.roleRepo        = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
    }

    // ── Required by Spring Security ─────────────────────────────────────────
    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepo.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found: " + username));

        var authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(), authorities);
    }

    // ── Register (always gives VIEWER role) ─────────────────────────────────
    public AuthResponse register(RegisterRequest req) {

        if (userRepo.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role viewerRole = roleRepo.findByName("VIEWER")
                .orElseThrow(() -> new RuntimeException("VIEWER role not seeded"));

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRoles(Set.of(viewerRole));

        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), "VIEWER");
    }

    // ── Login ────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {

        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("VIEWER");

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), roleName);
    }
}
