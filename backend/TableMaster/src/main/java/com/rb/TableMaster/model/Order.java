package com.rb.TableMaster.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Table(name = "client_order")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    @NotNull(message = "A mesa do pedido é obrigatória")
    @JsonBackReference("table-orders")
    private RestaurantTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_cpf", nullable = false)
    @NotNull(message = "O cliente do pedido é obrigatório")
    @JsonBackReference("user-orders")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("order-items")
    private List<OrderItem> items;

    @NotNull(message = "A data de criação é obrigatória")
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "O status do pedido é obrigatório")
    private OrderStatus status;

    private BigDecimal totalValue;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private LocalDateTime closedAt;

    private String reservedTime;
}