package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Sale;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByBusinessIdAndSaleDateBetweenOrderBySaleDateDescIdDesc(Long businessId, LocalDate from, LocalDate to);

    Optional<Sale> findByIdAndBusinessId(Long id, Long businessId);

    long countByBusinessId(Long businessId);

    @Query("select coalesce(sum(s.total), 0) from Sale s where s.businessId = :b and s.saleDate between :f and :t")
    BigDecimal totalSales(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);

    @Query("select coalesce(sum(i.qty * i.costPrice), 0) from SaleItem i join i.sale s "
            + "where s.businessId = :b and s.saleDate between :f and :t")
    BigDecimal costOfGoodsSold(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);

    @Query("select coalesce(sum(s.total - s.paid), 0) from Sale s where s.businessId = :b")
    BigDecimal totalReceivable(@Param("b") Long b);

    @Query("select coalesce(sum(s.total - s.paid), 0) from Sale s where s.businessId = :b and s.customerId = :c")
    BigDecimal receivableOf(@Param("b") Long b, @Param("c") Long customerId);

    @Query("select s.customerId, sum(s.total - s.paid) from Sale s where s.businessId = :b "
            + "and s.customerId is not null group by s.customerId")
    List<Object[]> receivableByCustomer(@Param("b") Long b);

    @Query("select s.saleDate, sum(s.total), count(s) from Sale s where s.businessId = :b "
            + "and s.saleDate between :f and :t group by s.saleDate order by s.saleDate")
    List<Object[]> dailySales(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);
}
