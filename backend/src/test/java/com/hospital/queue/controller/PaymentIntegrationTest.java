package com.hospital.queue.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.queue.dto.AppointmentRequest;
import com.hospital.queue.dto.PaymentOrderRequest;
import com.hospital.queue.dto.PaymentVerifyRequest;
import com.hospital.queue.entity.*;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.repository.PatientRepository;
import com.hospital.queue.repository.PaymentRepository;
import com.hospital.queue.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:pulsecare-payment-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false",
        "razorpay.key.id=",
        "razorpay.key.secret="
})
class PaymentIntegrationTest {

    private static final String PASSWORD = "StrongPassword!2026";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Patient patient1;
    private Patient patient2;
    private Patient staffUser;
    private Doctor doctorCardio;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        appointmentRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();

        // Doctors
        doctorCardio = new Doctor(
                "doc-cardio", "Dr. Sarah Jenkins", "Cardiology", "Consultant Cardiologist",
                "MD", "12 Years", 4.9, 150, "Room 101",
                "$60", "Mon-Fri", "10:00 AM", null, "Bio", "DR1"
        );
        doctorRepository.save(doctorCardio);

        // Patients
        patient1 = new Patient("Alice Walker", "+15551111111", 28, "Female");
        patient1.setPasswordHash(passwordEncoder.encode(PASSWORD));
        patient1.setRole("ROLE_PATIENT");
        patient1 = patientRepository.save(patient1);

        patient2 = new Patient("Bob Roberts", "+15552222222", 35, "Male");
        patient2.setPasswordHash(passwordEncoder.encode(PASSWORD));
        patient2.setRole("ROLE_PATIENT");
        patient2 = patientRepository.save(patient2);

        // Staff
        staffUser = new Patient("Reception Staff", "+15550000000", 30, "Female");
        staffUser.setPasswordHash(passwordEncoder.encode(PASSWORD));
        staffUser.setRole("ROLE_STAFF");
        staffUser = patientRepository.save(staffUser);
    }

    private MockHttpSession loginAs(String phone, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", phone,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private Appointment createTestAppointment(Patient patient, Doctor doctor) {
        Appointment apt = new Appointment(
                "APT-" + System.currentTimeMillis() % 10000,
                "DR1-TK01",
                1,
                patient.getName(),
                patient.getPhone(),
                patient.getAge(),
                patient.getGender(),
                doctor.getId(),
                doctor.getName(),
                doctor.getDepartment(),
                LocalDate.now().plusDays(1).toString(),
                "10:00 AM",
                "Heart palpitations",
                AppointmentStatus.WAITING,
                "2026-10-12T10:00:00"
        );
        apt.setPatient(patient);
        apt.setPaymentStatus("PENDING");
        return appointmentRepository.save(apt);
    }

    @Test
    void testDoctorFeePreviewInInr() throws Exception {
        mockMvc.perform(get("/api/payments/fee/" + doctorCardio.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doctorId").value(doctorCardio.getId()))
                .andExpect(jsonPath("$.amount").value(600.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.formattedAmount").value("₹600.00"));
    }

    @Test
    void testCreatePaymentOrder_PendingAndValidatedFee() throws Exception {
        Appointment appointment = createTestAppointment(patient1, doctorCardio);
        MockHttpSession session = loginAs(patient1.getPhone(), PASSWORD);

        PaymentOrderRequest orderRequest = new PaymentOrderRequest(appointment.getId());

        mockMvc.perform(post("/api/payments/create-order")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(appointment.getId()))
                .andExpect(jsonPath("$.amount").value(600.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.demoMode").value(true))
                .andExpect(jsonPath("$.provider").value("DEMO_SIMULATOR"))
                .andExpect(jsonPath("$.orderId").value(startsWith("order_demo_")));

        // Check appointment in database
        Appointment updated = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertEquals("PENDING", updated.getPaymentStatus());
        assertEquals(AppointmentStatus.WAITING, updated.getStatus()); // Queue status remains WAITING
        assertNotNull(updated.getPaymentId());
    }

    @Test
    void testDemoPaymentVerification_SuccessAndReceipt() throws Exception {
        Appointment appointment = createTestAppointment(patient1, doctorCardio);
        MockHttpSession session = loginAs(patient1.getPhone(), PASSWORD);

        // 1. Create order
        PaymentOrderRequest orderReq = new PaymentOrderRequest(appointment.getId());
        MvcResult orderResult = mockMvc.perform(post("/api/payments/create-order")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn();

        String paymentId = objectMapper.readTree(orderResult.getResponse().getContentAsString()).get("paymentId").asText();

        // 2. Verify payment (Demo Success)
        PaymentVerifyRequest verifyReq = new PaymentVerifyRequest();
        verifyReq.setPaymentId(paymentId);
        verifyReq.setAppointmentId(appointment.getId());
        verifyReq.setPaymentMethod("UPI");
        verifyReq.setSimulateFailure(false);

        MvcResult verifyResult = mockMvc.perform(post("/api/payments/verify")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.amount").value(600.00))
                .andExpect(jsonPath("$.receiptNumber").value(startsWith("RCPT-2026-")))
                .andExpect(jsonPath("$.paymentMethod").value("UPI"))
                .andExpect(jsonPath("$.demoMode").value(true))
                .andReturn();

        String receiptNumber = objectMapper.readTree(verifyResult.getResponse().getContentAsString()).get("receiptNumber").asText();

        // 3. Verify that appointment payment status is PAID, but appointment queue status is STILL WAITING
        Appointment updatedApt = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertEquals("PAID", updatedApt.getPaymentStatus());
        assertEquals(AppointmentStatus.WAITING, updatedApt.getStatus());

        // 4. Fetch receipt by receipt number
        mockMvc.perform(get("/api/payments/" + receiptNumber + "/receipt")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptNumber").value(receiptNumber))
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    @Test
    void testDemoPaymentVerification_SimulatedFailure() throws Exception {
        Appointment appointment = createTestAppointment(patient1, doctorCardio);
        MockHttpSession session = loginAs(patient1.getPhone(), PASSWORD);

        // Create order
        PaymentOrderRequest orderReq = new PaymentOrderRequest(appointment.getId());
        MvcResult orderResult = mockMvc.perform(post("/api/payments/create-order")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn();

        String paymentId = objectMapper.readTree(orderResult.getResponse().getContentAsString()).get("paymentId").asText();

        // Verify with simulateFailure = true
        PaymentVerifyRequest verifyReq = new PaymentVerifyRequest();
        verifyReq.setPaymentId(paymentId);
        verifyReq.setAppointmentId(appointment.getId());
        verifyReq.setSimulateFailure(true);
        verifyReq.setFailureReason("Bank network timeout");

        mockMvc.perform(post("/api/payments/verify")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Bank network timeout")));

        // Verify DB payment status is FAILED
        Payment payment = paymentRepository.findById(paymentId).orElseThrow();
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        assertEquals("FAILED", appointmentRepository.findById(appointment.getId()).orElseThrow().getPaymentStatus());
    }

    @Test
    void testPreventDuplicatePayment_AlreadyPaidReturnsConflict() throws Exception {
        Appointment appointment = createTestAppointment(patient1, doctorCardio);
        appointment.setPaymentStatus("PAID");
        appointmentRepository.save(appointment);

        MockHttpSession session = loginAs(patient1.getPhone(), PASSWORD);

        PaymentOrderRequest orderReq = new PaymentOrderRequest(appointment.getId());

        mockMvc.perform(post("/api/payments/create-order")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already paid")));
    }

    @Test
    void testWrongAppointmentOwnership_AccessDenied() throws Exception {
        // Appointment belongs to Patient 1
        Appointment appointment = createTestAppointment(patient1, doctorCardio);

        // Patient 2 attempts to create payment order for Patient 1's appointment
        MockHttpSession patient2Session = loginAs(patient2.getPhone(), PASSWORD);

        PaymentOrderRequest orderReq = new PaymentOrderRequest(appointment.getId());

        mockMvc.perform(post("/api/payments/create-order")
                        .session(patient2Session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRazorpayCryptographicSignatureVerification() throws Exception {
        String testSecret = "sample_test_secret_key_12345";
        String orderId = "order_M67abcdef12345";
        String paymentId = "pay_N89ghijkl67890";

        // Compute valid HMAC-SHA256
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(testSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String validSignature = HexFormat.of().formatHex(mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8)));

        // Use ReflectionTestUtils to set razorpayKeySecret on target service
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", testSecret);

        // Test valid signature passes
        assertTrue(paymentService.verifyRazorpaySignature(orderId, paymentId, validSignature));

        // Test invalid/tampered signature fails
        assertFalse(paymentService.verifyRazorpaySignature(orderId, paymentId, "invalid_tampered_signature"));
        assertFalse(paymentService.verifyRazorpaySignature(orderId, "wrong_payment_id", validSignature));
    }

    @Test
    void testQueueProgressionPreservedAfterPayment() throws Exception {
        Appointment appointment = createTestAppointment(patient1, doctorCardio);
        MockHttpSession patientSession = loginAs(patient1.getPhone(), PASSWORD);

        // 1. Complete payment
        PaymentOrderRequest orderReq = new PaymentOrderRequest(appointment.getId());
        MvcResult orderRes = mockMvc.perform(post("/api/payments/create-order")
                        .session(patientSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn();

        String paymentId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("paymentId").asText();

        PaymentVerifyRequest verifyReq = new PaymentVerifyRequest();
        verifyReq.setPaymentId(paymentId);
        verifyReq.setAppointmentId(appointment.getId());
        verifyReq.setPaymentMethod("UPI");
        mockMvc.perform(post("/api/payments/verify")
                        .session(patientSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        // 2. Doctor/Staff starts consultation
        MockHttpSession staffSession = loginAs(staffUser.getPhone(), PASSWORD);

        mockMvc.perform(post("/api/appointments/" + appointment.getId() + "/start")
                        .session(staffSession)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_CONSULTATION"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID")); // Payment status remains PAID

        // 3. Complete consultation
        mockMvc.perform(post("/api/appointments/" + appointment.getId() + "/complete")
                        .session(staffSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "ECG Normal, Followup in 2 weeks."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID")); // Still PAID
    }
}
