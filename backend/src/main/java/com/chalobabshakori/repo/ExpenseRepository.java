package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateDescIdDesc(
            Long businessId, LocalDate from, LocalDate to);

    Optional<Expense> findByIdAndBusinessId(Long id, Long businessId);

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.businessId = :b "
            + "and e.expenseDate between :f and :t")
    BigDecimal totalExpenses(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);

    @Query("select coalesce(e.category, 'Other'), sum(e.amount) from Expense e where e.businessId = :b "
            + "and e.expenseDate between :f and :t group by coalesce(e.category, 'Other') order by sum(e.amount) desc")
    List<Object[]> totalsByCategory(@Param("b") Long b, @Param("f") LocalDate f, @Param("t") LocalDate t);
}
