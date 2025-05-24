package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public record OrderDTO(
        @PositiveOrZero Long id,
        @NotNull @Positive Long tableId,
        @NotNull @NotBlank String userCpf,
        @NotNull @NotEmpty @Valid List<OrderItemDTO> items,
        LocalDateTime createdAt,
        @NotNull OrderStatus status
) {
}