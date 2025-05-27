package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.OrderItemStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id") // Chave estrangeira
    private Order order;

    @ManyToOne
    @JoinColumn(name = "menu_item_id") // Chave estrangeira
    private MenuItem menuItem;

    private int quantity;
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderItemStatus status = OrderItemStatus.PENDING;
}
