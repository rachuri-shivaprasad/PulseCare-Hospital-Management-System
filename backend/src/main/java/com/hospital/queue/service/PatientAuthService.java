package com.hospital.queue.service;

import com.hospital.queue.dto.PatientAccountResponse;
import com.hospital.queue.dto.PatientRegistrationRequest;
import com.hospital.queue.entity.Patient;
import com.hospital.queue.repository.PatientRepository;
import com.hospital.queue.security.PhoneNumbers;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@Service
public class PatientAuthService {

    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public PatientAuthService(PatientRepository patientRepository, PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public PatientAccountResponse register(PatientRegistrationRequest request) {
        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at most 72 UTF-8 bytes");
        }
        String phone = PhoneNumbers.normalize(request.getPhone());
        long matchingPatients = patientRepository.findAll().stream()
            .filter(patient -> PhoneNumbers.normalize(patient.getPhone()).equals(phone))
            .count();
        if (matchingPatients > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This phone number already has a patient record or account. Contact the clinic to verify an existing record.");
        }

        Patient patient = new Patient(request.getName().trim(), phone, null, null);
        patient.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        Patient saved;
        try {
            saved = patientRepository.saveAndFlush(patient);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This phone number already has a patient record or account");
        }
        return new PatientAccountResponse(saved.getId(), saved.getName(), saved.getPhone());
    }
}