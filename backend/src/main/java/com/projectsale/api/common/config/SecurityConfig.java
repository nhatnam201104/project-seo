package com.projectsale.api.common.config;

import com.projectsale.api.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private static final int BCRYPT_STRENGTH = 12;

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
  }

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      RestAuthenticationEntryPoint authenticationEntryPoint)
      throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .httpBasic(basic -> basic.disable())
        .formLogin(form -> form.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            requests -> requests
                .requestMatchers(PublicEndpoints.all())
                .permitAll()
                .anyRequest()
                .authenticated())
        .exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}
