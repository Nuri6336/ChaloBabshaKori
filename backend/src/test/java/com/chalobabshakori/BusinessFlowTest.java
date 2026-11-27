package com.chalobabshakori;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BusinessFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String register(String email) throws Exception {
        String body = """
                {"businessName":"Noor Traders","ownerName":"Abu Talha","email":"%s","password":"password123"}
                """.formatted(email);
        String res = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    private JsonNode doPost(String token, String url, String body) throws Exception {
        String res = mvc.perform(post(url).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString();
        return json.readTree(res);
    }

    private JsonNode doGet(String token, String url) throws Exception {
        String res = mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(res);
    }

    @Test
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateEmailAndBadLoginAreRejected() throws Exception {
        register("dup@example.com");
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"businessName":"X","ownerName":"Y","email":"dup@example.com","password":"password123"}"""))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"dup@example.com","password":"wrong-password"}""")).andExpect(status().isUnauthorized());
    }

    @Test
    void purchaseSaleAndDashboardFlow() throws Exception {
        String token = register("owner@example.com");

        long productId = doPost(token, "/api/products", """
                {"name":"USB Charger","purchasePrice":50,"sellingPrice":80,"stockQty":0,"lowStockThreshold":10}""")
                .get("id").asLong();
        long supplierId = doPost(token, "/api/suppliers", """
                {"name":"Dhaka Wholesale"}""").get("id").asLong();
        long customerId = doPost(token, "/api/customers", """
                {"name":"Rafiq"}""").get("id").asLong();

        doPost(token, "/api/purchases", """
                {"supplierId":%d,"items":[{"productId":%d,"qty":100,"unitCost":50}],"paid":3000}"""
                .formatted(supplierId, productId));
        assertThat(doGet(token, "/api/products/" + productId).get("stockQty").asInt()).isEqualTo(100);

        JsonNode sale = doPost(token, "/api/sales", """
                {"customerId":%d,"items":[{"productId":%d,"qty":5}],"discount":10,"paid":200}"""
                .formatted(customerId, productId));
        assertThat(sale.get("total").decimalValue()).isEqualByComparingTo("390");
        assertThat(sale.get("due").decimalValue()).isEqualByComparingTo("190");
        assertThat(doGet(token, "/api/products/" + productId).get("stockQty").asInt()).isEqualTo(95);

        // overselling is refused
        mvc.perform(post("/api/sales").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId":%d,"items":[{"productId":%d,"qty":1000}]}""".formatted(customerId, productId)))
                .andExpect(status().isConflict());

        doPost(token, "/api/sales/" + sale.get("id").asLong() + "/payments", """
                {"amount":90}""");

        doPost(token, "/api/expenses", """
                {"title":"Shop rent","category":"Rent","amount":100}""");

        JsonNode dash = doGet(token, "/api/dashboard");
        JsonNode summary = dash.get("summary");
        assertThat(summary.get("totalSales").decimalValue()).isEqualByComparingTo("390");
        assertThat(summary.get("totalPurchases").decimalValue()).isEqualByComparingTo("5000");
        assertThat(summary.get("costOfGoodsSold").decimalValue()).isEqualByComparingTo("250");
        assertThat(summary.get("grossProfit").decimalValue()).isEqualByComparingTo("140");
        assertThat(summary.get("netProfit").decimalValue()).isEqualByComparingTo("40");
        assertThat(dash.get("receivable").decimalValue()).isEqualByComparingTo("100");
        assertThat(dash.get("payable").decimalValue()).isEqualByComparingTo("2000");
        assertThat(dash.get("stockValue").decimalValue()).isEqualByComparingTo("4750");

        JsonNode customers = doGet(token, "/api/customers");
        assertThat(customers.get(0).get("balance").decimalValue()).isEqualByComparingTo("100");

        // deleting the sale restores stock
        mvc.perform(delete("/api/sales/" + sale.get("id").asLong()).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        assertThat(doGet(token, "/api/products/" + productId).get("stockQty").asInt()).isEqualTo(100);
    }

    @Test
    void businessesAreIsolated() throws Exception {
        String a = register("a@example.com");
        String b = register("b@example.com");
        long productId = doPost(a, "/api/products", """
                {"name":"Private","purchasePrice":1,"sellingPrice":2}""").get("id").asLong();
        mvc.perform(get("/api/products/" + productId).header("Authorization", "Bearer " + b))
                .andExpect(status().isNotFound());
        assertThat(doGet(b, "/api/products")).isEmpty();
    }
}
