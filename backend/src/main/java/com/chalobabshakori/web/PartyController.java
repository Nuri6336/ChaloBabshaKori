package com.chalobabshakori.web;

import com.chalobabshakori.domain.Party;
import com.chalobabshakori.repo.PartyRepository;
import com.chalobabshakori.repo.PurchaseRepository;
import com.chalobabshakori.repo.SaleRepository;
import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.web.dto.Dtos.PartyRequest;
import com.chalobabshakori.web.dto.Dtos.PartyResponse;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Customers (balance = receivable) and suppliers (balance = payable) share one implementation. */
@RestController
@RequestMapping("/api/{kind:customers|suppliers}")
public class PartyController {
    private final PartyRepository parties;
    private final SaleRepository sales;
    private final PurchaseRepository purchases;

    public PartyController(PartyRepository parties, SaleRepository sales, PurchaseRepository purchases) {
        this.parties = parties;
        this.sales = sales;
        this.purchases = purchases;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PartyResponse> list(@PathVariable String kind) {
        Party.Type type = typeOf(kind);
        Long b = CurrentUser.businessId();
        Map<Long, BigDecimal> balances = new HashMap<>();
        List<Object[]> rows = type == Party.Type.CUSTOMER ? sales.receivableByCustomer(b) : purchases.payableBySupplier(b);
        rows.forEach(r -> balances.put((Long) r[0], (BigDecimal) r[1]));
        return parties.findByBusinessIdAndTypeOrderByNameAsc(b, type).stream()
                .map(p -> toResponse(p, balances.getOrDefault(p.getId(), BigDecimal.ZERO))).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PartyResponse create(@PathVariable String kind, @Valid @RequestBody PartyRequest req) {
        Party p = new Party();
        p.setBusinessId(CurrentUser.businessId());
        p.setType(typeOf(kind));
        apply(p, req);
        return toResponse(parties.save(p), BigDecimal.ZERO);
    }

    @PutMapping("/{id}")
    @Transactional
    public PartyResponse update(@PathVariable String kind, @PathVariable Long id, @Valid @RequestBody PartyRequest req) {
        Party p = find(kind, id);
        apply(p, req);
        Long b = CurrentUser.businessId();
        BigDecimal balance = p.getType() == Party.Type.CUSTOMER ? sales.receivableOf(b, id) : purchases.payableOf(b, id);
        return toResponse(p, balance);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String kind, @PathVariable Long id) {
        Party p = find(kind, id);
        try {
            parties.delete(p);
            parties.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw ApiException.conflict("This record has transactions and cannot be deleted");
        }
    }

    private Party find(String kind, Long id) {
        return parties.findByIdAndBusinessIdAndType(id, CurrentUser.businessId(), typeOf(kind))
                .orElseThrow(() -> ApiException.notFound("Record"));
    }

    private static Party.Type typeOf(String kind) {
        return kind.equals("customers") ? Party.Type.CUSTOMER : Party.Type.SUPPLIER;
    }

    private static void apply(Party p, PartyRequest req) {
        p.setName(req.name().trim());
        p.setPhone(req.phone());
        p.setAddress(req.address());
    }

    private static PartyResponse toResponse(Party p, BigDecimal balance) {
        return new PartyResponse(p.getId(), p.getName(), p.getPhone(), p.getAddress(), balance);
    }
}
