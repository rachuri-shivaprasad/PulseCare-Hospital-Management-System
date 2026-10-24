package com.hospital.queue.security;

import com.hospital.queue.repository.PatientRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PatientUserDetailsService implements UserDetailsService {

    private final PatientRepository patientRepository;

    public PatientUserDetailsService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        String normalizedPhone = PhoneNumbers.normalize(phone);
        return patientRepository.findAll().stream()
            .filter(patient -> PhoneNumbers.normalize(patient.getPhone()).equals(normalizedPhone))
            .filter(patient -> patient.getPasswordHash() != null)
            .findFirst()
                .map(PatientPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid phone number or password"));
    }
}