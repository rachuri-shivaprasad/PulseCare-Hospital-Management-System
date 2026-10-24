package com.hospital.queue.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO used by ROLE_STAFF to manually verify a UPI payment
 * by cross-checking the transaction reference and confirming it as PAID or FAILED.
 */
public class ManualVerifyRequest {

    @NotBlank(message = "Payment ID is required")
    private String paymentId;

    /**
     * UPI/bank transaction reference ID that the patient shared (e.g., UTR number).
     * The authorized staff member must cross-check this with bank records before confirming.
     */
    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    /**
     * Whether to mark the payment as PAID (true) or FAILED (false).
     * Only ROLE_STAFF may call this endpoint.
     */
    private boolean approve = true;

    /** Optional note about the verification decision (e.g., "Matched UTR in bank portal"). */
    private String staffNote;

    public ManualVerifyRequest() {}

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public boolean isApprove() { return approve; }
    public void setApprove(boolean approve) { this.approve = approve; }

    public String getStaffNote() { return staffNote; }
    public void setStaffNote(String staffNote) { this.staffNote = staffNote; }
}
