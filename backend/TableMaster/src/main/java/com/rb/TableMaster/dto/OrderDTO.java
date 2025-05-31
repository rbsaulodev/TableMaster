package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record OrderDTO(
        @PositiveOrZero Long id,
        @NotNull Long tableId,
        String tableName,
        @NotNull String userCpf,
        String userName,
        List<OrderItemDTO> items,
        LocalDateTime createdAt,
        OrderStatus status,
        BigDecimal totalValue,
        PaymentMethod paymentMethod,
        LocalDateTime closedAt,
        String reservedTime
) {
}