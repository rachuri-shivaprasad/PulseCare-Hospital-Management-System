package com.hospital.queue.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentVerifyRequest {

    @NotBlank(message = "Payment ID is required")
    private String paymentId;

    private String appointmentId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    // For demo simulation
    private boolean simulateFailure;
    private String failureReason;
    private String paymentMethod; // "UPI", "CARD", "NETBANKING"

    /**
     * UPI transaction reference / UTR number provided by the patient after paying via UPI app.
     * This moves the status to PENDING_VERIFICATION, not PAID.
     */
    private String transactionReference;


    public PaymentVerifyRequest() {}

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public boolean isSimulateFailure() { return simulateFailure; }
    public void setSimulateFailure(boolean simulateFailure) { this.simulateFailure = simulateFailure; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
}
