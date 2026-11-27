package com.chalobabshakori.web;

import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.service.PurchaseService;
import com.chalobabshakori.web.dto.Dtos.PaymentRequest;
import com.chalobabshakori.web.dto.Dtos.PurchaseRequest;
import com.chalobabshakori.web.dto.Dtos.PurchaseResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {
    private final PurchaseService purchases;

    public PurchaseController(PurchaseService purchases) {
        this.purchases = purchases;
    }

    @GetMapping
    public List<PurchaseResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.withDayOfMonth(1);
        return purchases.list(CurrentUser.businessId(), start, end);
    }

    @GetMapping("/{id}")
    public PurchaseResponse get(@PathVariable Long id) {
        return purchases.get(CurrentUser.businessId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse create(@Valid @RequestBody PurchaseRequest req) {
        return purchases.create(CurrentUser.businessId(), req);
    }

    @PostMapping("/{id}/payments")
    public PurchaseResponse pay(@PathVariable Long id, @Valid @RequestBody PaymentRequest req) {
        return purchases.addPayment(CurrentUser.businessId(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        purchases.delete(CurrentUser.businessId(), id);
    }
}
