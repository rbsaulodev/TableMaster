package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

@Component
public class OrderMapper {

    private final OrderItemMapper orderItemMapper;

    public OrderMapper(OrderItemMapper orderItemMapper) {
        this.orderItemMapper = orderItemMapper;
    }

    public OrderDTO toDTO(Order order) {
        if (order == null) {
            return null;
        }

        String userCpf = null;
        String userName = null;
        if (order.getUser() != null) {
            userCpf = order.getUser().getCpf();
            userName = order.getUser().getFullName();
        }

        return new OrderDTO(
                order.getId(),
                order.getTable() != null ? order.getTable().getId() : null,
                order.getTable() != null && order.getTable().getNumber() != 0 ? "Mesa " + order.getTable().getNumber() : null,
                userCpf,
                userName,
                order.getItems() != null ?
                        order.getItems().stream()
                                .map(orderItemMapper::toDTO)
                                .toList()
                        : Collections.emptyList(),
                order.getCreatedAt(),
                order.getStatus() != null ? order.getStatus() : OrderStatus.OPEN,
                order.getTotalValue() != null ? order.getTotalValue() : BigDecimal.ZERO,
                order.getPaymentMethod(),
                order.getClosedAt(),
                order.getReservedTime()
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
        order.setReservedTime(orderDTO.reservedTime());

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
        if (orderDTO.reservedTime() != null) {
            order.setReservedTime(orderDTO.reservedTime());
        }
    }
}