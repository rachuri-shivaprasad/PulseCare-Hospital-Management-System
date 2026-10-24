package com.hospital.queue.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_appointment", columnList = "appointmentId"),
    @Index(name = "idx_payments_receipt", columnList = "receiptNumber"),
    @Index(name = "idx_payments_order", columnList = "providerOrderId")
})
public class Payment {

    @Id
    @Column(name = "id", length = 40)
    private String id; // e.g. "PAY-20261012-XXXX"

    @Column(nullable = false, length = 32)
    private String appointmentId;

    @Column(nullable = false)
    private String patientName;

    private String patientPhone;

    @Column(nullable = false, length = 32)
    private String doctorId;

    private String doctorName;
    private String department;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount; // e.g. 600.00

    @Column(nullable = false, length = 8)
    private String currency = "INR";

    @Column(length = 32)
    private String paymentMethod; // e.g. "UPI", "CARD", "NETBANKING", "DEMO_SIMULATOR"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PaymentStatus status;

    @Column(length = 32)
    private String provider; // "RAZORPAY" or "DEMO_SIMULATOR"

    @Column(length = 64)
    private String providerOrderId;

    @Column(length = 64)
    private String providerPaymentId;

    @Column(length = 64, unique = true)
    private String receiptNumber; // e.g. "RCPT-2026-98124"

    @Column(nullable = false, length = 32)
    private String createdAt;

    @Column(length = 32)
    private String verifiedAt;

    /** Staff member (name/phone) who manually verified this payment. */
    @Column(length = 128)
    private String verifiedBy;

    /** UPI transaction reference ID provided by the patient for staff to cross-check. */
    @Column(length = 64)
    private String transactionReference;

    /** UPI VPA (Virtual Payment Address) used as payment recipient. */
    @Column(length = 64)
    private String upiRecipient;

    @Column(length = 500)
    private String notes;

    public Payment() {}

    public Payment(String id, String appointmentId, String patientName, String patientPhone,
                   String doctorId, String doctorName, String department, BigDecimal amount,
                   String currency, String paymentMethod, PaymentStatus status, String provider,
                   String providerOrderId, String receiptNumber, String createdAt) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.patientName = patientName;
        this.patientPhone = patientPhone;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.department = department;
        this.amount = amount;
        this.currency = currency != null ? currency : "INR";
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.provider = provider;
        this.providerOrderId = providerOrderId;
        this.receiptNumber = receiptNumber;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderOrderId() { return providerOrderId; }
    public void setProviderOrderId(String providerOrderId) { this.providerOrderId = providerOrderId; }

    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(String verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getUpiRecipient() { return upiRecipient; }
    public void setUpiRecipient(String upiRecipient) { this.upiRecipient = upiRecipient; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
