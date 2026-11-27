package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBusinessIdAndRefTypeAndRefIdOrderByPaidAtAsc(
            Long businessId, Payment.RefType refType, Long refId);
}
