package com.projectsale.common.config;

import com.projectsale.api.auth.security.JwtAuthenticationFilter;
import com.projectsale.api.auth.security.RateLimitingFilter;
import com.projectsale.api.auth.security.oauth2.BindingAuthorizationRequestResolver;
import com.projectsale.api.auth.security.oauth2.OAuth2LoginFailureHandler;
import com.projectsale.api.auth.security.oauth2.OAuth2LoginSuccessHandler;
import com.projectsale.api.auth.service.CustomOidcUserService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
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

  /**
   * API stateless (JWT). Riêng đăng nhập Google dùng {@code oauth2Login()}: state
   * OAuth nằm trong HttpSession chỉ trong một vòng đăng nhập và bị huỷ ở
   * success/failure handler.
   */
  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      RateLimitingFilter rateLimitingFilter,
      RestAuthenticationEntryPoint authenticationEntryPoint,
      ClientRegistrationRepository clientRegistrationRepository,
      CustomOidcUserService oidcUserService,
      OAuth2LoginSuccessHandler oauth2SuccessHandler,
      OAuth2LoginFailureHandler oauth2FailureHandler)
      throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .httpBasic(basic -> basic.disable())
        .formLogin(form -> form.disable())
        .oauth2Login(oauth2 -> oauth2
            .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(
                new BindingAuthorizationRequestResolver(clientRegistrationRepository)))
            .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService))
            .successHandler(oauth2SuccessHandler)
            .failureHandler(oauth2FailureHandler))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            requests -> requests
                .requestMatchers(PublicEndpoints.all())
                .permitAll()
                .anyRequest()
                .authenticated()

        )
        .exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        // Trước cả filter OAuth2: /oauth2/authorization/* tạo HttpSession ở mỗi lần gọi nên
        // cũng phải chịu giới hạn, không chỉ các endpoint /api.
        .addFilterBefore(rateLimitingFilter, OAuth2AuthorizationRequestRedirectFilter.class)
        .build();
  }
}
