package com.internship.backend.config;

import com.internship.backend.security.JwtAuthFilter;
import com.internship.backend.service.AuthService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          AuthService authService,
                          PasswordEncoder passwordEncoder) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(authService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(h -> h.frameOptions(f -> f.disable()))
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/auth/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/h2-console/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}