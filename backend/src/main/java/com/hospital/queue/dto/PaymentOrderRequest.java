package com.hospital.queue.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentOrderRequest {

    @NotBlank(message = "Appointment ID is required")
    private String appointmentId;

    private String patientPhone;

    public PaymentOrderRequest() {}

    public PaymentOrderRequest(String appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
}
