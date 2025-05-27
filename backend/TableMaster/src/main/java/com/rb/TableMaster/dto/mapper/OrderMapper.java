package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.*;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
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
                        order.getItems().stream().map(this::toDTO).collect(Collectors.toList()) : null,
                order.getCreatedAt(),
                order.getStatus(),
                order.getTotalValue(),
                order.getPaymentMethod(),
                order.getClosedAt()
        );
    }

    public OrderItemDTO toDTO(OrderItem orderItem) {
        if (orderItem == null) {
            return null;
        }

        BigDecimal totalPrice = orderItem.getUnitPrice() != null ?
                orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity())) :
                BigDecimal.ZERO;

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