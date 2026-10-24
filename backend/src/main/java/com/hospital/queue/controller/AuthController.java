package com.hospital.queue.controller;

import com.hospital.queue.dto.PatientAccountResponse;
import com.hospital.queue.dto.PatientLoginRequest;
import com.hospital.queue.dto.PatientRegistrationRequest;
import com.hospital.queue.entity.Patient;
import com.hospital.queue.repository.PatientRepository;
import com.hospital.queue.security.PatientPrincipal;
import com.hospital.queue.service.PatientAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final PatientAuthService patientAuthService;
    private final PatientRepository patientRepository;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final HttpSessionCsrfTokenRepository csrfTokenRepository;

    public AuthController(
            PatientAuthService patientAuthService,
            PatientRepository patientRepository,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            HttpSessionCsrfTokenRepository csrfTokenRepository) {
        this.patientAuthService = patientAuthService;
        this.patientRepository = patientRepository;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("token", csrfToken.getToken()));
    }

    @PostMapping("/register")
    public ResponseEntity<PatientAccountResponse> register(
            @Valid @RequestBody PatientRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientAuthService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody PatientLoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.getPhone().trim(), request.getPassword()));
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid phone number or password"));
        }

        if (servletRequest.getSession(false) == null) {
            servletRequest.getSession(true);
        } else {
            servletRequest.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, servletRequest, servletResponse);
        csrfTokenRepository.saveToken(null, servletRequest, servletResponse);

        Patient patient = patientRepository.findByPhone(authentication.getName())
                .orElseThrow(() -> new AuthenticationServiceException("Authenticated patient no longer exists"));
        return ResponseEntity.ok(new PatientAccountResponse(patient.getId(), patient.getName(), patient.getPhone(), patient.getRole()));
    }

    @GetMapping("/me")
    public PatientAccountResponse currentPatient(@AuthenticationPrincipal PatientPrincipal principal) {
        return new PatientAccountResponse(principal.getPatientId(), principal.getName(), principal.getUsername(), principal.getRole());
    }
}