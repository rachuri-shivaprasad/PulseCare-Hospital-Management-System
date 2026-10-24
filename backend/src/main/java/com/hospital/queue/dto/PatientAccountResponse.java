package com.hospital.queue.dto;

public record PatientAccountResponse(Long id, String name, String phone, String role) {
    public PatientAccountResponse(Long id, String name, String phone) {
        this(id, name, phone, "ROLE_PATIENT");
    }
}