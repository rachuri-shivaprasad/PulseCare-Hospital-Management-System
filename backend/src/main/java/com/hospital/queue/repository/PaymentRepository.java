package com.hospital.queue.repository;

import com.hospital.queue.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    List<Payment> findByAppointmentId(String appointmentId);

    Optional<Payment> findFirstByAppointmentIdOrderByCreatedAtDesc(String appointmentId);

    Optional<Payment> findByProviderOrderId(String providerOrderId);

    Optional<Payment> findByReceiptNumber(String receiptNumber);
}
