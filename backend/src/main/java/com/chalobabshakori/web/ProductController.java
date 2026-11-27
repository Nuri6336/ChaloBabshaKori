package com.chalobabshakori.web;

import com.chalobabshakori.domain.Product;
import com.chalobabshakori.repo.ProductRepository;
import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.web.dto.Dtos.ProductRequest;
import com.chalobabshakori.web.dto.Dtos.StockAdjustRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping
    public List<Product> list() {
        return products.findByBusinessIdAndActiveTrueOrderByNameAsc(CurrentUser.businessId());
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return find(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest req) {
        Product p = new Product();
        p.setBusinessId(CurrentUser.businessId());
        apply(p, req);
        p.setStockQty(req.stockQty() == null ? 0 : req.stockQty());
        return products.save(p);
    }

    @PutMapping("/{id}")
    @Transactional
    public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        Product p = find(id);
        apply(p, req);
        if (req.stockQty() != null) {
            p.setStockQty(req.stockQty());
        }
        return p;
    }

    @PostMapping("/{id}/adjust-stock")
    @Transactional
    public Product adjustStock(@PathVariable Long id, @Valid @RequestBody StockAdjustRequest req) {
        Product p = products.lockByIdAndBusinessId(id, CurrentUser.businessId())
                .orElseThrow(() -> ApiException.notFound("Product"));
        int next = p.getStockQty() + req.delta();
        if (next < 0) {
            throw ApiException.conflict("Stock cannot go below zero");
        }
        p.setStockQty(next);
        return p;
    }

    /** Products referenced by past invoices are archived rather than removed. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        find(id).setActive(false);
    }

    private Product find(Long id) {
        return products.findByIdAndBusinessId(id, CurrentUser.businessId())
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Product"));
    }

    private void apply(Product p, ProductRequest req) {
        p.setName(req.name().trim());
        p.setSku(blankToNull(req.sku()));
        p.setBarcode(blankToNull(req.barcode()));
        p.setCategory(blankToNull(req.category()));
        p.setUnit(blankToNull(req.unit()));
        p.setPurchasePrice(req.purchasePrice());
        p.setSellingPrice(req.sellingPrice());
        if (req.lowStockThreshold() != null) {
            p.setLowStockThreshold(req.lowStockThreshold());
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
