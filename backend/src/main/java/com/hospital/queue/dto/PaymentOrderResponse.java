package com.hospital.queue.dto;

import java.math.BigDecimal;

public class PaymentOrderResponse {

    private String paymentId;
    private String appointmentId;
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String keyId;
    private String provider;
    private boolean demoMode;
    private String doctorName;
    private String patientName;
    private String formattedAmount;
    private String status;
    private String message;
    /** UPI Virtual Payment Address (e.g. 7569252605@ybl). */
    private String upiRecipient;
    /** Pre-built UPI deep-link for launching a UPI app. */
    private String upiDeepLink;
    /** Appointment date (YYYY-MM-DD). */
    private String appointmentDate;
    /** Queue token number. */
    private String tokenNumber;


    public PaymentOrderResponse() {}

    public PaymentOrderResponse(String paymentId, String appointmentId, String orderId,
                                BigDecimal amount, String currency, String keyId,
                                String provider, boolean demoMode, String doctorName,
                                String patientName, String formattedAmount, String status,
                                String message) {
        this.paymentId = paymentId;
        this.appointmentId = appointmentId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.keyId = keyId;
        this.provider = provider;
        this.demoMode = demoMode;
        this.doctorName = doctorName;
        this.patientName = patientName;
        this.formattedAmount = formattedAmount;
        this.status = status;
        this.message = message;
    }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public boolean isDemoMode() { return demoMode; }
    public void setDemoMode(boolean demoMode) { this.demoMode = demoMode; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getFormattedAmount() { return formattedAmount; }
    public void setFormattedAmount(String formattedAmount) { this.formattedAmount = formattedAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getUpiRecipient() { return upiRecipient; }
    public void setUpiRecipient(String upiRecipient) { this.upiRecipient = upiRecipient; }

    public String getUpiDeepLink() { return upiDeepLink; }
    public void setUpiDeepLink(String upiDeepLink) { this.upiDeepLink = upiDeepLink; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }
}
