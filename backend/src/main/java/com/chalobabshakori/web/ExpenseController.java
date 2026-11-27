package com.chalobabshakori.web;

import com.chalobabshakori.domain.Expense;
import com.chalobabshakori.repo.ExpenseRepository;
import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.web.dto.Dtos.ExpenseRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseRepository expenses;

    public ExpenseController(ExpenseRepository expenses) {
        this.expenses = expenses;
    }

    @GetMapping
    public List<Expense> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.withDayOfMonth(1);
        return expenses.findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateDescIdDesc(
                CurrentUser.businessId(), start, end);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Expense create(@Valid @RequestBody ExpenseRequest req) {
        Expense e = new Expense();
        e.setBusinessId(CurrentUser.businessId());
        apply(e, req);
        return expenses.save(e);
    }

    @PutMapping("/{id}")
    @Transactional
    public Expense update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest req) {
        Expense e = find(id);
        apply(e, req);
        return e;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        expenses.delete(find(id));
    }

    private Expense find(Long id) {
        return expenses.findByIdAndBusinessId(id, CurrentUser.businessId())
                .orElseThrow(() -> ApiException.notFound("Expense"));
    }

    private static void apply(Expense e, ExpenseRequest req) {
        e.setTitle(req.title().trim());
        e.setCategory(req.category());
        e.setAmount(req.amount());
        e.setExpenseDate(req.expenseDate() != null ? req.expenseDate() : LocalDate.now());
        e.setNote(req.note());
    }
}
