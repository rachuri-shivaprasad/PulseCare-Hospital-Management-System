package com.hospital.queue.dto;

import java.math.BigDecimal;

public class PaymentReceiptResponse {

    private String receiptNumber;
    private String paymentId;
    private String appointmentId;
    private String tokenNumber;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String department;
    private BigDecimal amount;
    private String formattedAmount;
    private String currency;
    private String paymentMethod;
    private String status;
    private String provider;
    private String providerOrderId;
    private String providerPaymentId;
    private String createdAt;
    private String verifiedAt;
    private boolean demoMode;
    private String hospitalName = "PulseCare Multi-Speciality Hospital";
    private String hospitalGstin = "36AAACP0000A1Z5";
    private String clinicAddress = "OPD Central Block, Health City, Hyderabad, TG";
    private String notes;
    /** UPI Virtual Payment Address used as recipient (e.g. 7569252605@ybl). */
    private String upiRecipient;
    /** UPI/bank transaction reference ID confirmed by staff. */
    private String transactionReference;
    /** Name / identifier of the staff member who approved this payment. */
    private String verifiedBy;


    public PaymentReceiptResponse() {}

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getFormattedAmount() { return formattedAmount; }
    public void setFormattedAmount(String formattedAmount) { this.formattedAmount = formattedAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderOrderId() { return providerOrderId; }
    public void setProviderOrderId(String providerOrderId) { this.providerOrderId = providerOrderId; }

    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(String verifiedAt) { this.verifiedAt = verifiedAt; }

    public boolean isDemoMode() { return demoMode; }
    public void setDemoMode(boolean demoMode) { this.demoMode = demoMode; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getHospitalGstin() { return hospitalGstin; }
    public void setHospitalGstin(String hospitalGstin) { this.hospitalGstin = hospitalGstin; }

    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getUpiRecipient() { return upiRecipient; }
    public void setUpiRecipient(String upiRecipient) { this.upiRecipient = upiRecipient; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
}
