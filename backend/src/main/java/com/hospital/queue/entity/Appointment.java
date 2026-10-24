package com.hospital.queue.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_doctor_date", columnList = "doctorId, date"),
    @Index(name = "idx_status", columnList = "status")
})
public class Appointment {

    @Id
    @Column(name = "id", length = 32)
    private String id; // e.g. "APT-1001"

    @Column(nullable = false, length = 32)
    private String tokenNumber; // e.g. "DR1-TK01"

    @Column(nullable = false)
    private Integer tokenSequence; // e.g. 1, 2, 3

    @Column(nullable = false)
    private String patientName;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    private String patientPhone;
    private Integer patientAge;
    private String patientGender;

    @Column(nullable = false)
    private String doctorId;

    private String doctorName;
    private String department;

    @Column(nullable = false, length = 16)
    private String date; // YYYY-MM-DD

    private String timeSlot;

    @Column(length = 1000)
    private String symptoms;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AppointmentStatus status;

    private String createdAt;
    private String calledAt;
    private String completedAt;
    private String skippedAt;
    private String cancelledAt;
    @Column(length = 2000)
    private String notes;

    // Vitals
    private String bp;
    private String heartRate;
    private String temp;
    private String spo2;

    // Payment fields
    @Column(length = 32)
    private String paymentStatus = "PENDING"; // PENDING, PAID, FAILED, REFUNDED

    @Column(length = 64)
    private String paymentId;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal consultationFeeInr;

    public Appointment() {}

    public Appointment(String id, String tokenNumber, Integer tokenSequence, String patientName,
                       String patientPhone, Integer patientAge, String patientGender, String doctorId,
                       String doctorName, String department, String date, String timeSlot,
                       String symptoms, AppointmentStatus status, String createdAt) {
        this.id = id;
        this.tokenNumber = tokenNumber;
        this.tokenSequence = tokenSequence;
        this.patientName = patientName;
        this.patientPhone = patientPhone;
        this.patientAge = patientAge;
        this.patientGender = patientGender;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.department = department;
        this.date = date;
        this.timeSlot = timeSlot;
        this.symptoms = symptoms;
        this.status = status;
        this.createdAt = createdAt;
        this.bp = "120/80";
        this.heartRate = "72 bpm";
        this.temp = "98.6 °F";
        this.spo2 = "99%";
    }

    // Helper to get formatted status matching frontend expectations
    public String getStatusDisplayName() {
        return status != null ? status.getDisplayName() : "Waiting";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public Integer getTokenSequence() { return tokenSequence; }
    public void setTokenSequence(Integer tokenSequence) { this.tokenSequence = tokenSequence; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public Integer getPatientAge() { return patientAge; }
    public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }

    public String getPatientGender() { return patientGender; }
    public void setPatientGender(String patientGender) { this.patientGender = patientGender; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getCalledAt() { return calledAt; }
    public void setCalledAt(String calledAt) { this.calledAt = calledAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getSkippedAt() { return skippedAt; }
    public void setSkippedAt(String skippedAt) { this.skippedAt = skippedAt; }

    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getBp() { return bp; }
    public void setBp(String bp) { this.bp = bp; }

    public String getHeartRate() { return heartRate; }
    public void setHeartRate(String heartRate) { this.heartRate = heartRate; }

    public String getTemp() { return temp; }
    public void setTemp(String temp) { this.temp = temp; }

    public String getSpo2() { return spo2; }
    public void setSpo2(String spo2) { this.spo2 = spo2; }

    public String getPaymentStatus() { return paymentStatus != null ? paymentStatus : "PENDING"; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public java.math.BigDecimal getConsultationFeeInr() { return consultationFeeInr; }
    public void setConsultationFeeInr(java.math.BigDecimal consultationFeeInr) { this.consultationFeeInr = consultationFeeInr; }
}
