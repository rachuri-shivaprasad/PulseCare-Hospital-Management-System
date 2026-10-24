package com.hospital.queue.security;

import com.hospital.queue.entity.Patient;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class PatientPrincipal implements UserDetails {

    private final Patient patient;

    public PatientPrincipal(Patient patient) {
        this.patient = patient;
    }

    public Long getPatientId() {
        return patient.getId();
    }

    public Long getId() {
        return patient.getId();
    }

    public String getPhone() {
        return patient.getPhone();
    }

    public Patient getPatient() {
        return patient;
    }

    public String getName() {
        return patient.getName();
    }

    public String getRole() {
        return patient.getRole() != null && !patient.getRole().isBlank() ? patient.getRole() : "ROLE_PATIENT";
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(getRole()));
    }

    @Override
    public String getPassword() {
        return patient.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return patient.getPhone();
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return patient.getPasswordHash() != null; }
}