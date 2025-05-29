package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDTO(
        @PositiveOrZero
        Long id,

        @NotNull @Positive
        Long tableId,

        String tableName,

        @NotNull @Positive
        Long userCpf,

        String userName,

        @NotNull @NotEmpty @Valid
        List<OrderItemDTO> items,

        LocalDateTime createdAt,

        @NotNull
        OrderStatus status,

        @PositiveOrZero
        BigDecimal totalValue,

        PaymentMethod paymentMethod,

        LocalDateTime closedAt
) {
}