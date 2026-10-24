package com.hospital.queue.entity;

public enum PaymentStatus {
    /** Payment order created; patient has not yet opened a UPI app or initiated payment. */
    PENDING,
    /** Patient has opened UPI app / claimed payment. Awaiting staff verification of transaction reference. */
    PENDING_VERIFICATION,
    /** Staff-verified or gateway-confirmed payment. Receipt may be generated. */
    PAID,
    /** Payment failed or was rejected. */
    FAILED,
    /** Refunded after successful payment. */
    REFUNDED
}
