package com.hospital.queue.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.entity.Patient;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.repository.PatientRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:pulsecare-auth-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
class PatientAuthSecurityTest {

    private static final String PASSWORD = "StrongPassword!2026";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearPatients() {
                appointmentRepository.deleteAll();
        patientRepository.deleteAll();
    }

    @Test
    void registrationStoresBcryptHashAndDoesNotReturnIt() throws Exception {
        String request = registrationJson("Riley Patient", "+1 555 101 1001");

        String response = mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phone").value("+15551011001"))
                .andReturn().getResponse().getContentAsString();

        Patient patient = patientRepository.findByPhone("+15551011001").orElseThrow();
        assertTrue(patient.getPasswordHash().startsWith("$2a$") || patient.getPasswordHash().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches(PASSWORD, patient.getPasswordHash()));
        assertFalse(response.contains(patient.getPasswordHash()));
        assertFalse(response.contains(PASSWORD));
    }

    @Test
    void duplicatePhoneRegistrationIsRejected() throws Exception {
        String request = registrationJson("Riley Patient", "+1 (555) 101-1002");
        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("Riley Patient", "+1 555 101 1002")))
                .andExpect(status().isConflict());

        assertTrue(patientRepository.findAll().stream()
                .filter(patient -> patient.getPhone().equals("+15551011002")).count() == 1);
    }

    @Test
    void validLoginCreatesSessionAndCurrentPatientResponse() throws Exception {
        register("Riley Patient", "+1 555 101 1003");

        MvcResult login = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+1 555 101 1003", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Riley Patient"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+15551011003"));
        mockMvc.perform(get("/api/appointments").session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidLoginReturnsUnauthorized() throws Exception {
        register("Riley Patient", "+1 555 101 1004");

        mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+1 555 101 1004", "password", "incorrect password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Invalid")));
    }

    @Test
    void anonymousCannotReadPatientHistoryOrStaffQueues() throws Exception {
        mockMvc.perform(get("/api/patient/appointments"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/queue/doctor/doc-1"))
                .andExpect(status().isUnauthorized());
    }

        @Test
        void authenticatedHistoryReturnsOnlyOwnAppointmentsAndIgnoresSuppliedPatientId() throws Exception {
                register("History Owner", "+1 555 101 1010");
                register("Other Patient", "+1 555 101 1011");
                Patient owner = patientRepository.findByPhone("+15551011010").orElseThrow();
                Patient other = patientRepository.findByPhone("+15551011011").orElseThrow();
                Doctor doctor = doctorRepository.findById("doc-1").orElseThrow();
                appointmentRepository.save(patientAppointment("AUTH-HISTORY-OWN", owner, doctor));
                appointmentRepository.save(patientAppointment("AUTH-HISTORY-OTHER", other, doctor));

                MockHttpSession session = loginSession("+1 555 101 1010");
                mockMvc.perform(get("/api/patient/appointments")
                                                .param("patientId", other.getId().toString())
                                                .session(session))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                                .andExpect(jsonPath("$[0].id").value("AUTH-HISTORY-OWN"))
                                .andExpect(jsonPath("$[0].patientName").value("History Owner"))
                                .andExpect(jsonPath("$[0].date").exists())
                                .andExpect(jsonPath("$[0].timeSlot").value("10:00 AM"))
                                .andExpect(jsonPath("$[0].doctorName").value(doctor.getName()))
                                .andExpect(jsonPath("$[0].department").value(doctor.getDepartment()))
                                .andExpect(jsonPath("$[0].tokenNumber").value("DR1-HISTORY01"))
                                .andExpect(jsonPath("$[0].statusDisplayName").value("Waiting"));
        }

        @Test
        void authenticatedPatientWithNoAppointmentsGetsEmptyHistory() throws Exception {
                register("Empty History Patient", "+1 555 101 1012");

                mockMvc.perform(get("/api/patient/appointments")
                                                .session(loginSession("+1 555 101 1012")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isEmpty());
        }

    @Test
    void csrfBootstrapTokenIsAcceptedAndMissingTokenIsRejected() throws Exception {
        MvcResult csrfResponse = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();
        String token = objectMapper.readTree(csrfResponse.getResponse().getContentAsString())
                .get("token").asText();
        MockHttpSession session = (MockHttpSession) csrfResponse.getRequest().getSession(false);

        mockMvc.perform(post("/api/auth/register")
                        .session(session)
                        .header("X-CSRF-TOKEN", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("CSRF Patient", "+1 555 101 1007")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("No CSRF Patient", "+1 555 101 1008")))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutInvalidatesPatientSession() throws Exception {
        register("Logout Patient", "+1 555 101 1009");
        MvcResult login = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+1 555 101 1009", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientCannotCancelAnotherPatientsAppointment() throws Exception {
        register("Riley Patient", "+1 555 101 1005");
        register("Jordan Patient", "+1 555 101 1006");
        Patient owner = patientRepository.findByPhone("+15551011006").orElseThrow();
        Doctor doctor = doctorRepository.findById("doc-1").orElseThrow();
        Appointment foreignAppointment = new Appointment(
                "AUTH-FOREIGN-1", "DR1-AUTH01", 1, owner.getName(), owner.getPhone(), null, null,
                doctor.getId(), doctor.getName(), doctor.getDepartment(), LocalDate.now().toString(),
                "10:00 AM", "Test", AppointmentStatus.WAITING,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        foreignAppointment.setPatient(owner);
        appointmentRepository.save(foreignAppointment);

        MvcResult login = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+1 555 101 1005", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();

        mockMvc.perform(post("/api/patient/appointments/AUTH-FOREIGN-1/cancel")
                        .session((MockHttpSession) login.getRequest().getSession(false))
                        .with(csrf()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/patient/appointments")
                        .param("patientId", owner.getId().toString())
                        .session((MockHttpSession) login.getRequest().getSession(false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist());
    }

    @Test
    void patientCanCancelOwnWaitingAppointment() throws Exception {
        register("Cancellation Owner", "+1 555 101 1013");
        Patient owner = patientRepository.findByPhone("+15551011013").orElseThrow();
        Doctor doctor = doctorRepository.findById("doc-1").orElseThrow();
        appointmentRepository.save(patientAppointment("AUTH-CANCEL-OWN", owner, doctor));
        MockHttpSession session = loginSession("+1 555 101 1013");

        mockMvc.perform(post("/api/patient/appointments/AUTH-CANCEL-OWN/cancel")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusDisplayName").value("Cancelled"));

        assertEquals(AppointmentStatus.CANCELLED,
                appointmentRepository.findById("AUTH-CANCEL-OWN").orElseThrow().getStatus());
    }

    private MockHttpSession loginSession(String phone) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) login.getRequest().getSession(false);
    }

    private Appointment patientAppointment(String id, Patient patient, Doctor doctor) {
        Appointment appointment = new Appointment(
                id, "DR1-HISTORY01", 1, patient.getName(), patient.getPhone(), 35, "Other",
                doctor.getId(), doctor.getName(), doctor.getDepartment(), LocalDate.now().toString(),
                "10:00 AM", "History test", AppointmentStatus.WAITING,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        appointment.setPatient(patient);
        return appointment;
    }

    private void register(String name, String phone) throws Exception {
        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(name, phone)))
                .andExpect(status().isCreated());
    }

    private String registrationJson(String name, String phone) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "name", name,
                "phone", phone,
                "password", PASSWORD));
    }
}