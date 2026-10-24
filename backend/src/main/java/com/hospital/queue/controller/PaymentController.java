package com.hospital.queue.controller;

import com.hospital.queue.dto.ManualVerifyRequest;
import com.hospital.queue.dto.PaymentOrderRequest;
import com.hospital.queue.dto.PaymentOrderResponse;
import com.hospital.queue.dto.PaymentReceiptResponse;
import com.hospital.queue.dto.PaymentVerifyRequest;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;
    private final DoctorRepository doctorRepository;

    public PaymentController(PaymentService paymentService, DoctorRepository doctorRepository) {
        this.paymentService = paymentService;
        this.doctorRepository = doctorRepository;
    }

    /**
     * Get trusted doctor consultation fee preview in INR.
     */
    @GetMapping("/fee/{doctorId}")
    public ResponseEntity<?> getDoctorConsultationFee(@PathVariable String doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found: " + doctorId));
        }
        BigDecimal fee = paymentService.calculateDoctorFeeInr(doctor);
        return ResponseEntity.ok(Map.of(
                "doctorId", doctor.getId(),
                "doctorName", doctor.getName(),
                "department", doctor.getDepartment(),
                "amount", fee,
                "currency", "INR",
                "formattedAmount", "₹" + fee.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                "upiRecipient", "7569252605@ybl",
                "isRazorpayEnabled", paymentService.isRazorpayConfigured()
        ));
    }

    /**
     * Create or retrieve pending UPI payment order for an appointment.
     * Returns PENDING status with UPI deep-link and recipient ID.
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@Valid @RequestBody PaymentOrderRequest request, Authentication authentication) {
        try {
            PaymentOrderResponse response = paymentService.createPaymentOrder(request, authentication);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to initialize payment: " + e.getMessage()));
        }
    }

    /**
     * Patient submits UPI transaction reference after claiming to have paid.
     * Moves payment to PENDING_VERIFICATION — NOT to PAID.
     * Staff must use /manual-verify to confirm.
     *
     * For Razorpay with valid cryptographic signature: marks PAID directly (gateway-confirmed).
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request, Authentication authentication) {
        try {
            PaymentReceiptResponse receipt = paymentService.verifyPayment(request, authentication);
            return ResponseEntity.ok(receipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Signature verification failed: " + e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Payment verification error: " + e.getMessage()));
        }
    }

    /**
     * STAFF-ONLY: Manually verify (approve or reject) a payment after reviewing the UPI transaction reference.
     * This is the ONLY authorized path (besides Razorpay cryptographic verification) that sets payment to PAID.
     *
     * Security: returns 403 if caller is not ROLE_STAFF.
     */
    @PostMapping("/manual-verify")
    public ResponseEntity<?> manualVerifyPayment(@Valid @RequestBody ManualVerifyRequest request, Authentication authentication) {
        try {
            PaymentReceiptResponse receipt = paymentService.manualVerifyPayment(request, authentication);
            return ResponseEntity.ok(receipt);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Payment verification error: " + e.getMessage()));
        }
    }

    /**
     * Get receipt by payment ID or receipt number.
     * Note: receipt is only meaningful for PAID payments.
     */
    @GetMapping("/{identifier}/receipt")
    public ResponseEntity<?> getReceipt(@PathVariable String identifier, Authentication authentication) {
        try {
            PaymentReceiptResponse receipt = paymentService.getReceipt(identifier, authentication);
            return ResponseEntity.ok(receipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Could not fetch receipt: " + e.getMessage()));
        }
    }

    /**
     * Get payment details by appointment ID.
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getPaymentByAppointment(@PathVariable String appointmentId, Authentication authentication) {
        try {
            return paymentService.getPaymentByAppointment(appointmentId, authentication)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}
