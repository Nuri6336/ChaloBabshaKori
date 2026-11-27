package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Product;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByBusinessIdAndActiveTrueOrderByNameAsc(Long businessId);

    Optional<Product> findByIdAndBusinessId(Long id, Long businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id and p.businessId = :b")
    Optional<Product> lockByIdAndBusinessId(@Param("id") Long id, @Param("b") Long businessId);

    @Query("select p from Product p where p.businessId = :b and p.active = true "
            + "and p.stockQty <= p.lowStockThreshold order by p.stockQty asc, p.name asc")
    List<Product> findLowStock(@Param("b") Long businessId);

    @Query("select coalesce(sum(p.stockQty * p.purchasePrice), 0) from Product p "
            + "where p.businessId = :b and p.active = true")
    BigDecimal stockValue(@Param("b") Long businessId);

    @Query("select coalesce(sum(p.stockQty), 0) from Product p where p.businessId = :b and p.active = true")
    Long totalUnits(@Param("b") Long businessId);
}
