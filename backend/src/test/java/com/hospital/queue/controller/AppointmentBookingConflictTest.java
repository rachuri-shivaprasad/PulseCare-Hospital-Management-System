package com.hospital.queue.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import com.hospital.queue.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests that verify the PulseCare hospital queue booking model:
 *
 *  - MULTIPLE different patients CAN book the same doctor / date / time-slot and
 *    all join the WAITING queue with distinct sequential tokens.
 *  - The SAME patient (same phone) is blocked from booking the same slot twice.
 *  - A CANCELLED appointment releases its slot so the same patient can rebook.
 *  - Different doctors at the same time always succeed independently.
 *  - Concurrent submissions by different patients both succeed; concurrent
 *    submissions by the same patient allow only one through.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:pulsecare-booking-conflicts;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
class AppointmentBookingConflictTest {

    /** Each test uses a fresh phone number so patients never collide across tests. */
    private static final AtomicInteger PHONE_SEQUENCE = new AtomicInteger(7000000);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // Core queue model: multiple patients, same slot
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    void firstBookingForSlotSucceeds() throws Exception {
        postBooking("doc-1", "2099-02-01", "09:00 AM")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenNumber").exists());
    }

    /**
     * KEY TEST: two DIFFERENT patients (different phones) booking the same
     * doctor / date / time-slot must BOTH succeed and receive distinct tokens.
     */
    @Test
    void twoDifferentPatientsCanBookSameDoctorSlotAndJoinWaitingQueue() throws Exception {
        MvcResult first = postBooking("doc-1", "2099-03-01", "10:00 AM")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenNumber").exists())
                .andReturn();

        MvcResult second = postBooking("doc-1", "2099-03-01", "10:00 AM")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenNumber").exists())
                .andReturn();

        JsonNode r1 = objectMapper.readTree(first.getResponse().getContentAsString());
        JsonNode r2 = objectMapper.readTree(second.getResponse().getContentAsString());

        // Both must be WAITING
        assertEquals("WAITING", r1.get("status").asText());
        assertEquals("WAITING", r2.get("status").asText());

        // Tokens must be distinct
        assertNotEquals(r1.get("tokenNumber").asText(), r2.get("tokenNumber").asText(),
                "Two patients in the same slot must receive distinct tokens");

        // Token sequences must differ (sequential queue positions)
        assertNotEquals(r1.get("tokenSequence").asInt(), r2.get("tokenSequence").asInt(),
                "Token sequences must be unique");

        // Exactly 2 WAITING appointments must exist for this slot
        long waitingCount = appointmentRepository
                .findByDoctorIdAndDate("doc-1", "2099-03-01")
                .stream()
                .filter(a -> a.getTimeSlot().equals("10:00 AM"))
                .filter(a -> a.getStatus() == AppointmentStatus.WAITING)
                .count();
        assertEquals(2, waitingCount,
                "Both patients should be in the waiting queue for the slot");
    }

    @Test
    void threeDistinctPatientsAllJoinSameSlotWithSequentialTokens() throws Exception {
        String date = "2099-03-02";
        String slot = "11:00 AM";

        MvcResult r1 = postBooking("doc-1", date, slot).andExpect(status().isCreated()).andReturn();
        MvcResult r2 = postBooking("doc-1", date, slot).andExpect(status().isCreated()).andReturn();
        MvcResult r3 = postBooking("doc-1", date, slot).andExpect(status().isCreated()).andReturn();

        JsonNode j1 = objectMapper.readTree(r1.getResponse().getContentAsString());
        JsonNode j2 = objectMapper.readTree(r2.getResponse().getContentAsString());
        JsonNode j3 = objectMapper.readTree(r3.getResponse().getContentAsString());

        List<Integer> seqs = List.of(j1.get("tokenSequence").asInt(),
                                     j2.get("tokenSequence").asInt(),
                                     j3.get("tokenSequence").asInt());
        assertEquals(3, seqs.stream().distinct().count(), "Each patient must get a unique token sequence");

        long waiting = appointmentRepository.findByDoctorIdAndDate("doc-1", date)
                .stream()
                .filter(a -> a.getTimeSlot().equals(slot) && a.getStatus() == AppointmentStatus.WAITING)
                .count();
        assertEquals(3, waiting);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Same-patient duplicate prevention
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    void samePhoneCannotBookSameSlotTwice() throws Exception {
        // Use a fixed phone number for both calls so they represent the same patient
        String sharedPhone = "+1" + PHONE_SEQUENCE.incrementAndGet();

        postBookingWithPhone("doc-1", "2099-04-01", "10:00 AM", sharedPhone)
                .andExpect(status().isCreated());

        // Second call with identical phone → must be rejected (same patient, same slot)
        postBookingWithPhone("doc-1", "2099-04-01", "10:00 AM", sharedPhone)
                .andExpect(status().isConflict());

        // Only one non-cancelled appointment should exist
        long count = appointmentRepository
                .findByDoctorIdAndDate("doc-1", "2099-04-01")
                .stream()
                .filter(a -> a.getTimeSlot().equals("10:00 AM") && a.getStatus() != AppointmentStatus.CANCELLED)
                .count();
        assertEquals(1, count, "Same patient must not create duplicate slot bookings");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Cancelled appointments release the slot for the same patient
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    void cancelledAppointmentAllowsSamePatientToRebook() throws Exception {
        String sharedPhone = "+1" + PHONE_SEQUENCE.incrementAndGet();

        MvcResult firstBooking = postBookingWithPhone("doc-1", "2099-02-05", "01:00 PM", sharedPhone)
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode response = objectMapper.readTree(firstBooking.getResponse().getContentAsString());
        Appointment appointment = appointmentRepository.findById(response.get("id").asText()).orElseThrow();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);

        // Same patient can now rebook the same slot
        postBookingWithPhone("doc-1", "2099-02-05", "01:00 PM", sharedPhone)
                .andExpect(status().isCreated());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Orthogonal booking rules
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    void bookingAtDifferentTimeForSameDoctorSucceeds() throws Exception {
        postBooking("doc-1", "2099-02-03", "10:00 AM")
                .andExpect(status().isCreated());

        postBooking("doc-1", "2099-02-03", "10:30 AM")
                .andExpect(status().isCreated());
    }

    @Test
    void bookingForDifferentDoctorAtSameTimeSucceeds() throws Exception {
        postBooking("doc-1", "2099-02-04", "11:00 AM")
                .andExpect(status().isCreated());

        postBooking("doc-2", "2099-02-04", "11:00 AM")
                .andExpect(status().isCreated());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Concurrency
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Two DIFFERENT patients submitting concurrently must BOTH succeed (queue model).
     */
    @Test
    void concurrentRequestsByDifferentPatientsAllSucceed() throws Exception {
        Callable<Integer> first  = () -> postBooking("doc-1", "2099-05-01", "02:00 PM")
                .andReturn().getResponse().getStatus();
        Callable<Integer> second = () -> postBooking("doc-1", "2099-05-01", "02:00 PM")
                .andReturn().getResponse().getStatus();

        var executor = Executors.newFixedThreadPool(2);
        try {
            var results = executor.invokeAll(List.of(first, second));
            int s1 = results.get(0).get();
            int s2 = results.get(1).get();
            assertEquals(201, s1, "First concurrent patient should succeed");
            assertEquals(201, s2, "Second concurrent patient should also succeed (queue model)");
        } finally {
            executor.shutdownNow();
        }
    }

    /**
     * The SAME patient submitting twice concurrently: exactly one must succeed (201)
     * and the other must be rejected (409).
     */
    @Test
    void concurrentRequestsBySamePatientAllowOnlyOne() throws Exception {
        String sharedPhone = "+1" + PHONE_SEQUENCE.incrementAndGet();
        Callable<Integer> first  = () -> postBookingWithPhone("doc-1", "2099-05-02", "03:00 PM", sharedPhone)
                .andReturn().getResponse().getStatus();
        Callable<Integer> second = () -> postBookingWithPhone("doc-1", "2099-05-02", "03:00 PM", sharedPhone)
                .andReturn().getResponse().getStatus();

        var executor = Executors.newFixedThreadPool(2);
        try {
            var results = executor.invokeAll(List.of(first, second));
            int s1 = results.get(0).get();
            int s2 = results.get(1).get();
            assertTrue((s1 == 201 && s2 == 409) || (s1 == 409 && s2 == 201),
                    "Exactly one concurrent duplicate booking by same patient should be rejected");
        } finally {
            executor.shutdownNow();
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /** Books with a freshly-generated unique phone number (simulates a new patient). */
    private org.springframework.test.web.servlet.ResultActions postBooking(
            String doctorId, String date, String timeSlot) throws Exception {
        String phone = "+1" + PHONE_SEQUENCE.incrementAndGet();
        return postBookingWithPhone(doctorId, date, timeSlot, phone);
    }

    /** Books with an explicitly provided phone number. */
    private org.springframework.test.web.servlet.ResultActions postBookingWithPhone(
            String doctorId, String date, String timeSlot, String phone) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientName",   "Queue Patient",
                "patientPhone",  phone,
                "patientAge",    35,
                "patientGender", "Other",
                "doctorId",      doctorId,
                "date",          date,
                "timeSlot",      timeSlot,
                "symptoms",      "Automated queue-model booking test"));

        return mockMvc.perform(post("/api/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }
}