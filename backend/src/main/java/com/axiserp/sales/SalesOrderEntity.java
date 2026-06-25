package com.axiserp.sales;

import com.axiserp.customer.CustomerEntity;
import com.axiserp.inventory.ItemEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_orders")
public class SalesOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ItemEntity item;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SalesOrderStatus status;

    @Column(length = 255)
    private String memo;

    @Column(nullable = false, length = 80)
    private String orderedBy;

    @Column(nullable = false)
    private LocalDateTime orderedAt;

    @Column(length = 80)
    private String processedBy;

    private LocalDateTime processedAt;

    protected SalesOrderEntity() {
    }

    public SalesOrderEntity(String orderNo, CustomerEntity customer, ItemEntity item, int quantity, BigDecimal unitPrice, String memo, String orderedBy) {
        this.orderNo = orderNo;
        this.customer = customer;
        this.item = item;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.status = SalesOrderStatus.REGISTERED;
        this.memo = memo;
        this.orderedBy = orderedBy;
        this.orderedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public CustomerEntity getCustomer() {
        return customer;
    }

    public ItemEntity getItem() {
        return item;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public SalesOrderStatus getStatus() {
        return status;
    }

    public String getMemo() {
        return memo;
    }

    public String getOrderedBy() {
        return orderedBy;
    }

    public LocalDateTime getOrderedAt() {
        return orderedAt;
    }

    public String getProcessedBy() {
        return processedBy;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void cancel(String processedBy) {
        if (status != SalesOrderStatus.REGISTERED) {
            throw new IllegalStateException("등록 상태의 판매 수주만 취소할 수 있습니다.");
        }
        this.status = SalesOrderStatus.CANCELED;
        this.processedBy = processedBy;
        this.processedAt = LocalDateTime.now();
    }
}
