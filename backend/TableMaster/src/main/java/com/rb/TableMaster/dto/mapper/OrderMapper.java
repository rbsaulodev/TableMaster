package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.*;
import com.rb.TableMaster.model.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderDTO toDTO(Order order) {
        if (order == null) {
            return null;
        }

        return new OrderDTO(
                order.getId(),
                order.getTable() != null ? order.getTable().getId() : null,
                order.getTable() != null ? "Mesa " + order.getTable().getNumber() : null,
                order.getUser() != null ? Long.valueOf(order.getUser().getCpf()) : null,
                order.getUser() != null ? order.getUser().getFullName() : null,
                order.getItems() != null ?
                        order.getItems().stream()
                                .map(this::toItemDTO)
                                .collect(Collectors.toList()) : List.of(),
                order.getCreatedAt(),
                order.getStatus() != null ? order.getStatus() : OrderStatus.OPEN,
                order.getTotalValue() != null ? order.getTotalValue() : BigDecimal.ZERO,
                order.getPaymentMethod(),
                order.getClosedAt()
        );
    }

    public Order toEntity(OrderDTO orderDTO) {
        if (orderDTO == null) {
            return null;
        }

        Order order = new Order();
        order.setId(orderDTO.id());
        order.setCreatedAt(orderDTO.createdAt() != null ? orderDTO.createdAt() : LocalDateTime.now());
        order.setStatus(orderDTO.status() != null ? orderDTO.status() : OrderStatus.OPEN);
        order.setTotalValue(orderDTO.totalValue() != null ? orderDTO.totalValue() : BigDecimal.ZERO);
        order.setPaymentMethod(orderDTO.paymentMethod());
        order.setClosedAt(orderDTO.closedAt());

        return order;
    }

    public void updateEntityFromDTO(OrderDTO orderDTO, Order order) {
        if (orderDTO == null || order == null) {
            return;
        }

        if (orderDTO.status() != null) {
            order.setStatus(orderDTO.status());
        }
        if (orderDTO.totalValue() != null) {
            order.setTotalValue(orderDTO.totalValue());
        }
        if (orderDTO.paymentMethod() != null) {
            order.setPaymentMethod(orderDTO.paymentMethod());
        }
        if (orderDTO.closedAt() != null) {
            order.setClosedAt(orderDTO.closedAt());
        }
    }

    private OrderItemDTO toItemDTO(OrderItem orderItem) {
        if (orderItem == null) {
            return null;
        }

        BigDecimal totalPrice = BigDecimal.ZERO;
        if (orderItem.getUnitPrice() != null && orderItem.getQuantity() > 0) {
            totalPrice = orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
        }

        return new OrderItemDTO(
                orderItem.getId(),
                orderItem.getOrder() != null ? orderItem.getOrder().getId() : null,
                orderItem.getMenuItem() != null ? orderItem.getMenuItem().getId() : null,
                orderItem.getMenuItem() != null ? orderItem.getMenuItem().getName() : null,
                orderItem.getMenuItem() != null ? orderItem.getMenuItem().getDescription() : null,
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                totalPrice,
                orderItem.getStatus()
        );
    }
}