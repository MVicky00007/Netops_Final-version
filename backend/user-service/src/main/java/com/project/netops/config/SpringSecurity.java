package com.project.netops.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import com.project.netops.security.JwtFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SpringSecurity {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public static PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception
    {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for Postman testing
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/signup","/login","/forgot-password","/update-profile").permitAll()
                .requestMatchers("/swagger-ui.html","/swagger-ui/**","/api-docs/**","/v3/api-docs/**","/swagger-resources/**","/webjars/**").permitAll()
                // GET /users is allowed to any authenticated user so engineer
                // dropdowns (Assign ticket, Assign task, etc.) can populate.
                // The DTO carries no password — just the public profile fields.
                .requestMatchers(HttpMethod.GET, "/users").authenticated()
                // Mutating user state is admin-only.
                .requestMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")
                .requestMatchers("/update-role", "/block-user", "/unblock-user", "/approve-user", "/pending-users").hasRole("ADMIN")
                .anyRequest().authenticated() // Require authentication for all other endpoints
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(httpBasic -> httpBasic.disable()) // Disable default HTTP Basic authentication;
            .formLogin(form -> form.disable()); // Disable default form login
        return http.build();
    }
}
