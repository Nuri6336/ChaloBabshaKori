package com.chalobabshakori.web;

import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.service.SaleService;
import com.chalobabshakori.web.dto.Dtos.PaymentRequest;
import com.chalobabshakori.web.dto.Dtos.SaleRequest;
import com.chalobabshakori.web.dto.Dtos.SaleResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleService sales;

    public SaleController(SaleService sales) {
        this.sales = sales;
    }

    @GetMapping
    public List<SaleResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.withDayOfMonth(1);
        return sales.list(CurrentUser.businessId(), start, end);
    }

    @GetMapping("/{id}")
    public SaleResponse get(@PathVariable Long id) {
        return sales.get(CurrentUser.businessId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResponse create(@Valid @RequestBody SaleRequest req) {
        return sales.create(CurrentUser.businessId(), req);
    }

    @PostMapping("/{id}/payments")
    public SaleResponse pay(@PathVariable Long id, @Valid @RequestBody PaymentRequest req) {
        return sales.addPayment(CurrentUser.businessId(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sales.delete(CurrentUser.businessId(), id);
    }
}
