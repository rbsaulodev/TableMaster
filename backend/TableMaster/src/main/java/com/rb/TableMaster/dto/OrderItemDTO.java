package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.OrderItemStatus;
import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record OrderItemDTO(
        @PositiveOrZero
        Long id,

        Long orderId,

        @NotNull(message = "ID do item do menu é obrigatório")
        @Positive(message = "ID do item do menu deve ser positivo")
        Long menuItemId,

        String menuItemName,

        String menuItemDescription,

        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser positiva")
        Integer quantity,

        @NotNull(message = "Preço unitário é obrigatório")
        @Positive(message = "Preço unitário deve ser positivo")
        BigDecimal unitPrice,

        @PositiveOrZero
        BigDecimal totalPrice,

        @NotNull
        OrderItemStatus status
) {}