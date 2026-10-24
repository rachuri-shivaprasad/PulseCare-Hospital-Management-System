package com.hospital.queue.service;

import com.hospital.queue.dto.ManualVerifyRequest;
import com.hospital.queue.dto.PaymentOrderRequest;
import com.hospital.queue.dto.PaymentOrderResponse;
import com.hospital.queue.dto.PaymentReceiptResponse;
import com.hospital.queue.dto.PaymentVerifyRequest;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.entity.Payment;
import com.hospital.queue.entity.PaymentStatus;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.repository.PaymentRepository;
import com.hospital.queue.security.PatientPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final String UPI_RECIPIENT = "7569252605@ybl";
    private static final String UPI_PAYEE_NAME = "PulseCare Hospital";

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    public PaymentService(PaymentRepository paymentRepository,
                          AppointmentRepository appointmentRepository,
                          DoctorRepository doctorRepository) {
        this.paymentRepository = paymentRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    public boolean isRazorpayConfigured() {
        return razorpayKeyId != null && !razorpayKeyId.isBlank()
                && razorpayKeySecret != null && !razorpayKeySecret.isBlank();
    }

    /**
     * Calculate server-validated consultation fee in INR from trusted Doctor entity.
     */
    public BigDecimal calculateDoctorFeeInr(Doctor doctor) {
        if (doctor == null || doctor.getConsultationFee() == null) {
            return new BigDecimal("500.00");
        }
        String feeStr = doctor.getConsultationFee().replaceAll("[^0-9.]", "").trim();
        if (feeStr.isEmpty()) {
            return new BigDecimal("500.00");
        }
        try {
            double parsed = Double.parseDouble(feeStr);
            if (parsed <= 0) {
                return new BigDecimal("500.00");
            }
            if (parsed < 100) {
                // Stored fee was in USD-like units (e.g., $60 -> ₹600.00)
                return BigDecimal.valueOf(parsed * 10.0).setScale(2, RoundingMode.HALF_UP);
            } else {
                return BigDecimal.valueOf(parsed).setScale(2, RoundingMode.HALF_UP);
            }
        } catch (NumberFormatException e) {
            return new BigDecimal("500.00");
        }
    }

    /**
     * Build a UPI deep-link URI.
     * Format: upi://pay?pa=VPA&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=TXN_NOTE
     */
    public String buildUpiDeepLink(BigDecimal amount, String appointmentId) {
        try {
            String txnNote = URLEncoder.encode("OPD Consultation Fee - " + appointmentId, StandardCharsets.UTF_8);
            String payeeName = URLEncoder.encode(UPI_PAYEE_NAME, StandardCharsets.UTF_8);
            String amountStr = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
            return "upi://pay?pa=" + UPI_RECIPIENT
                    + "&pn=" + payeeName
                    + "&am=" + amountStr
                    + "&cu=INR"
                    + "&tn=" + txnNote;
        } catch (Exception e) {
            return "upi://pay?pa=" + UPI_RECIPIENT;
        }
    }

    /**
     * Create or retrieve pending payment order for an appointment.
     * Sets paymentStatus to PENDING, never PAID.
     */
    @Transactional
    public PaymentOrderResponse createPaymentOrder(PaymentOrderRequest request, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + request.getAppointmentId()));

        verifyAppointmentAccess(appointment, authentication, request.getPatientPhone());

        // If already paid, reject — do not re-open payment
        if ("PAID".equalsIgnoreCase(appointment.getPaymentStatus())) {
            throw new IllegalStateException("Appointment " + appointment.getId() + " is already paid.");
        }

        Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
        BigDecimal amountInr = calculateDoctorFeeInr(doctor);

        // Update appointment with validated fee
        appointment.setConsultationFeeInr(amountInr);

        // Check if a PENDING or PENDING_VERIFICATION order already exists and reuse it
        Optional<Payment> existingPending = paymentRepository
                .findFirstByAppointmentIdOrderByCreatedAtDesc(appointment.getId())
                .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.PENDING_VERIFICATION);

        Payment payment;
        if (existingPending.isPresent()) {
            payment = existingPending.get();
            // Update amount in case fee changed
            payment.setAmount(amountInr);
            payment.setUpiRecipient(UPI_RECIPIENT);
            paymentRepository.save(payment);
        } else {
            String provider = isRazorpayConfigured() ? "RAZORPAY" : "UPI_MANUAL";
            String orderId = isRazorpayConfigured()
                    ? "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16)
                    : "upi_order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

            String paymentId = "PAY-" + System.currentTimeMillis() % 100000 + "-" + (int) (Math.random() * 9000 + 1000);
            String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            String receiptNumber = "RCPT-" + LocalDateTime.now().getYear() + "-" + (int) (Math.random() * 900000 + 100000);

            payment = new Payment(
                    paymentId,
                    appointment.getId(),
                    appointment.getPatientName(),
                    appointment.getPatientPhone(),
                    appointment.getDoctorId(),
                    appointment.getDoctorName(),
                    appointment.getDepartment(),
                    amountInr,
                    "INR",
                    "UPI",
                    PaymentStatus.PENDING,   // Always PENDING at creation — never PAID
                    provider,
                    orderId,
                    receiptNumber,
                    now
            );
            payment.setUpiRecipient(UPI_RECIPIENT);
            payment.setNotes("Consultation Fee - " + appointment.getDoctorName() + " (" + appointment.getDepartment() + ")");

            paymentRepository.save(payment);

            appointment.setPaymentId(paymentId);
            // Ensure appointment payment status remains PENDING
            appointment.setPaymentStatus("PENDING");
            appointmentRepository.save(appointment);
        }

        String formattedAmount = "₹" + amountInr.setScale(2, RoundingMode.HALF_UP).toPlainString();
        String upiDeepLink = buildUpiDeepLink(amountInr, appointment.getId());

        String message = "Scan QR or tap 'Pay using UPI' to complete payment. After paying, enter your UPI transaction reference so reception can verify it.";

        PaymentOrderResponse resp = new PaymentOrderResponse(
                payment.getId(),
                appointment.getId(),
                payment.getProviderOrderId(),
                amountInr,
                "INR",
                isRazorpayConfigured() ? razorpayKeyId : null,
                payment.getProvider(),
                !isRazorpayConfigured(),
                appointment.getDoctorName(),
                appointment.getPatientName(),
                formattedAmount,
                payment.getStatus().name(),
                message
        );
        resp.setUpiRecipient(UPI_RECIPIENT);
        resp.setUpiDeepLink(upiDeepLink);
        resp.setAppointmentDate(appointment.getDate());
        resp.setTokenNumber(appointment.getTokenNumber());
        return resp;
    }

    /**
     * Patient submits UPI transaction reference after claiming to have paid.
     * This moves the payment to PENDING_VERIFICATION — NOT to PAID.
     * A staff member must call manualVerifyPayment() to confirm or reject.
     *
     * For Razorpay with a real signature: performs cryptographic verification, then marks PAID.
     */
    @Transactional(noRollbackFor = {IllegalArgumentException.class, SecurityException.class})
    public PaymentReceiptResponse verifyPayment(PaymentVerifyRequest request, Authentication authentication) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .or(() -> paymentRepository.findByProviderOrderId(request.getPaymentId()))
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found: " + request.getPaymentId()));

        Appointment appointment = appointmentRepository.findById(payment.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Associated appointment not found: " + payment.getAppointmentId()));

        verifyAppointmentAccess(appointment, authentication, appointment.getPatientPhone());

        // Idempotency: if already paid or pending_verification, return current state
        if (payment.getStatus() == PaymentStatus.PAID) {
            return buildReceiptResponse(payment, appointment);
        }
        if (payment.getStatus() == PaymentStatus.PENDING_VERIFICATION) {
            return buildReceiptResponse(payment, appointment);
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        // Handle Razorpay with real signature verification → mark PAID directly (gateway-confirmed)
        if ("RAZORPAY".equalsIgnoreCase(payment.getProvider()) && isRazorpayConfigured()) {
            if (request.getRazorpayPaymentId() == null || request.getRazorpaySignature() == null) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                appointment.setPaymentStatus("FAILED");
                appointmentRepository.save(appointment);
                throw new SecurityException("Missing Razorpay signature or payment ID");
            }

            boolean validSignature = verifyRazorpaySignature(
                    payment.getProviderOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature()
            );

            if (!validSignature) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                appointment.setPaymentStatus("FAILED");
                appointmentRepository.save(appointment);
                throw new SecurityException("Invalid payment signature verification failed");
            }

            // Razorpay signature is cryptographically valid — safe to mark PAID
            payment.setProviderPaymentId(request.getRazorpayPaymentId());
            if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
                payment.setPaymentMethod(request.getPaymentMethod());
            }
            payment.setStatus(PaymentStatus.PAID);
            payment.setVerifiedAt(now);
            payment.setVerifiedBy("Razorpay Gateway (Cryptographic Signature)");
            paymentRepository.save(payment);

            appointment.setPaymentStatus("PAID");
            appointment.setPaymentId(payment.getId());
            appointmentRepository.save(appointment);

            return buildReceiptResponse(payment, appointment);
        }

        // UPI / Manual flow — patient provides transaction reference
        // Move to PENDING_VERIFICATION; appointment stays in queue normally
        if (request.getTransactionReference() != null && !request.getTransactionReference().isBlank()) {
            payment.setTransactionReference(request.getTransactionReference().trim());
        }
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            payment.setPaymentMethod(request.getPaymentMethod());
        } else {
            payment.setPaymentMethod("UPI");
        }
        payment.setStatus(PaymentStatus.PENDING_VERIFICATION);
        payment.setNotes("Patient submitted UPI payment claim. Awaiting staff verification of transaction reference: "
                + (payment.getTransactionReference() != null ? payment.getTransactionReference() : "(none provided)"));
        paymentRepository.save(payment);

        // Appointment payment status reflects PENDING_VERIFICATION — does NOT block the queue
        appointment.setPaymentStatus("PENDING_VERIFICATION");
        appointmentRepository.save(appointment);

        return buildReceiptResponse(payment, appointment);
    }

    /**
     * STAFF-ONLY: Manually verify a payment by reviewing the transaction reference.
     * Sets payment to PAID (approve=true) or FAILED (approve=false) with full audit trail.
     * This is the ONLY path (besides Razorpay cryptographic verification) that sets PAID.
     */
    @Transactional
    public PaymentReceiptResponse manualVerifyPayment(ManualVerifyRequest request, Authentication authentication) {
        // Security: only ROLE_STAFF may call this method
        if (!isStaff(authentication)) {
            throw new AccessDeniedException("Only authorized hospital staff may verify payments manually.");
        }

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found: " + request.getPaymentId()));

        Appointment appointment = appointmentRepository.findById(payment.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Associated appointment not found: " + payment.getAppointmentId()));

        // Idempotency
        if (payment.getStatus() == PaymentStatus.PAID) {
            return buildReceiptResponse(payment, appointment);
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String staffIdentifier = resolveStaffIdentifier(authentication);

        payment.setTransactionReference(request.getTransactionReference().trim());
        payment.setVerifiedAt(now);
        payment.setVerifiedBy(staffIdentifier);

        if (request.isApprove()) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setNotes("Payment verified by staff [" + staffIdentifier + "] at " + now
                    + ". Transaction Ref: " + request.getTransactionReference()
                    + (request.getStaffNote() != null && !request.getStaffNote().isBlank() ? ". Note: " + request.getStaffNote() : ""));
            paymentRepository.save(payment);

            appointment.setPaymentStatus("PAID");
            appointment.setPaymentId(payment.getId());
            appointmentRepository.save(appointment);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setNotes("Payment REJECTED by staff [" + staffIdentifier + "] at " + now
                    + ". Transaction Ref: " + request.getTransactionReference()
                    + (request.getStaffNote() != null && !request.getStaffNote().isBlank() ? ". Reason: " + request.getStaffNote() : ""));
            paymentRepository.save(payment);

            appointment.setPaymentStatus("FAILED");
            appointmentRepository.save(appointment);
        }

        return buildReceiptResponse(payment, appointment);
    }

    /**
     * Get receipt by payment ID, appointment ID, or receipt number.
     * Receipt is only meaningful if status is PAID.
     */
    @Transactional(readOnly = true)
    public PaymentReceiptResponse getReceipt(String identifier, Authentication authentication) {
        Payment payment = paymentRepository.findById(identifier)
                .or(() -> paymentRepository.findByReceiptNumber(identifier))
                .or(() -> paymentRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Payment or receipt not found for: " + identifier));

        Appointment appointment = appointmentRepository.findById(payment.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Associated appointment not found for payment: " + payment.getId()));

        verifyAppointmentAccess(appointment, authentication, appointment.getPatientPhone());

        return buildReceiptResponse(payment, appointment);
    }

    /**
     * Get payment status and details for an appointment.
     */
    @Transactional(readOnly = true)
    public Optional<PaymentReceiptResponse> getPaymentByAppointment(String appointmentId, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));

        verifyAppointmentAccess(appointment, authentication, appointment.getPatientPhone());

        return paymentRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(appointmentId)
                .map(payment -> buildReceiptResponse(payment, appointment));
    }

    /**
     * Verify Razorpay cryptographic signature: HmacSHA256(order_id + "|" + payment_id, secret)
     */
    public boolean verifyRazorpaySignature(String orderId, String paymentId, String receivedSignature) {
        if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            return false;
        }
        try {
            String data = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String generatedSignature = HexFormat.of().formatHex(hash);
            return generatedSignature.equalsIgnoreCase(receivedSignature);
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private boolean isStaff(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        if (authentication.getPrincipal() instanceof PatientPrincipal principal) {
            return "ROLE_STAFF".equalsIgnoreCase(principal.getRole());
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STAFF".equals(a.getAuthority()));
    }

    private String resolveStaffIdentifier(Authentication authentication) {
        if (authentication.getPrincipal() instanceof PatientPrincipal principal) {
            return principal.getName() + " (" + principal.getPhone() + ")";
        }
        return authentication.getName();
    }

    private void verifyAppointmentAccess(Appointment appointment, Authentication authentication, String phone) {
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof PatientPrincipal principal) {
            if ("ROLE_STAFF".equalsIgnoreCase(principal.getRole())) {
                return; // Staff can view/manage all hospital appointments
            }
            // Check if patient owns this appointment
            boolean matchesId = appointment.getPatient() != null && appointment.getPatient().getId().equals(principal.getId());
            boolean matchesPhone = appointment.getPatientPhone() != null && appointment.getPatientPhone().equals(principal.getPhone());
            if (!matchesId && !matchesPhone) {
                throw new AccessDeniedException("Access denied: You can only access payments for your own appointments.");
            }
        } else if (phone != null && !phone.isBlank()) {
            // Unauthenticated guest verification: phone must match appointment's recorded phone
            if (!phone.trim().equals(appointment.getPatientPhone())) {
                throw new AccessDeniedException("Phone number does not match appointment record.");
            }
        }
    }

    private PaymentReceiptResponse buildReceiptResponse(Payment payment, Appointment appointment) {
        PaymentReceiptResponse response = new PaymentReceiptResponse();
        response.setReceiptNumber(payment.getReceiptNumber());
        response.setPaymentId(payment.getId());
        response.setAppointmentId(payment.getAppointmentId());
        response.setTokenNumber(appointment.getTokenNumber());
        response.setPatientName(payment.getPatientName());
        response.setPatientPhone(payment.getPatientPhone());
        response.setDoctorName(payment.getDoctorName());
        response.setDepartment(payment.getDepartment());
        response.setAmount(payment.getAmount());
        response.setFormattedAmount("₹" + payment.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());
        response.setCurrency(payment.getCurrency());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setStatus(payment.getStatus().name());
        response.setProvider(payment.getProvider());
        response.setProviderOrderId(payment.getProviderOrderId());
        response.setProviderPaymentId(payment.getProviderPaymentId());
        response.setCreatedAt(payment.getCreatedAt());
        response.setVerifiedAt(payment.getVerifiedAt());
        response.setDemoMode(false); // No more demo simulator — real UPI only
        response.setNotes(payment.getNotes());
        response.setUpiRecipient(UPI_RECIPIENT);
        response.setTransactionReference(payment.getTransactionReference());
        response.setVerifiedBy(payment.getVerifiedBy());
        return response;
    }
}
