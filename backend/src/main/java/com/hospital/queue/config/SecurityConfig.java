
package com.hospital.queue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

import com.hospital.queue.security.PatientUserDetailsService;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            PatientUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public HttpSessionCsrfTokenRepository csrfTokenRepository() {
        HttpSessionCsrfTokenRepository repository =
                new HttpSessionCsrfTokenRepository();

        repository.setHeaderName("X-CSRF-TOKEN");

        return repository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            HttpSessionCsrfTokenRepository csrfTokenRepository,
            SecurityContextRepository securityContextRepository)
            throws Exception {

        http
            .cors(Customizer.withDefaults())

            // Keep CSRF protection for application endpoints.
            // Exclude only the local H2 Console.
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .ignoringRequestMatchers("/h2-console/**")
            )

            .securityContext(context -> context
                .securityContextRepository(securityContextRepository)
            )

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.IF_REQUIRED
                )
                .sessionFixation(fixation ->
                    fixation.changeSessionId()
                )
            )

            .requestCache(cache ->
                cache.requestCache(new NullRequestCache())
            )

            .authorizeHttpRequests(authorize -> authorize

                .requestMatchers(
                    HttpMethod.OPTIONS, "/**"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/auth/csrf",
                    "/api/doctors",
                    "/api/doctors/**",
                    "/api/payments/fee/**"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/appointments"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/auth/me"
                ).hasAnyRole("PATIENT", "STAFF")

                .requestMatchers(
                    "/api/patient/**"
                ).hasRole("PATIENT")

                .requestMatchers(
                    "/api/appointments",
                    "/api/appointments/**",
                    "/api/queue/**"
                ).hasRole("STAFF")

                .requestMatchers(
                    "/api/payments",
                    "/api/payments/**"
                ).hasAnyRole("PATIENT", "STAFF")

                // Local development console only.
                .requestMatchers(
                    "/h2-console/**"
                ).permitAll()

                // Deny anything not explicitly allowed.
                .anyRequest().denyAll()
            )

            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(
                    (request, response, exception) ->
                        response.sendError(401)
                )
                .accessDeniedHandler(
                    (request, response, exception) ->
                        response.sendError(403)
                )
            )

            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler(
                    (request, response, authentication) ->
                        response.setStatus(204)
                )
            );

        return http.build();
    }
}
