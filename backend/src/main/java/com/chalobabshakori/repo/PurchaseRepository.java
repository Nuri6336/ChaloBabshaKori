package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Purchase;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByBusinessIdAndPurchaseDateBetweenOrderByPurchaseDateDescIdDesc(
            Long businessId, LocalDate from, LocalDate to);

    Optional<Purchase> findByIdAndBusinessId(Long id, Long businessId);

    long countByBusinessId(Long businessId);

    @Query("select coalesce(sum(p.total), 0) from Purchase p where p.businessId = :b "
            + "and p.purchaseDate between :f and :t")
    BigDecimal totalPurchases(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);

    @Query("select coalesce(sum(p.total - p.paid), 0) from Purchase p where p.businessId = :b")
    BigDecimal totalPayable(@Param("b") Long b);

    @Query("select coalesce(sum(p.total - p.paid), 0) from Purchase p where p.businessId = :b and p.supplierId = :s")
    BigDecimal payableOf(@Param("b") Long b, @Param("s") Long supplierId);

    @Query("select p.supplierId, sum(p.total - p.paid) from Purchase p where p.businessId = :b "
            + "and p.supplierId is not null group by p.supplierId")
    List<Object[]> payableBySupplier(@Param("b") Long b);
}
