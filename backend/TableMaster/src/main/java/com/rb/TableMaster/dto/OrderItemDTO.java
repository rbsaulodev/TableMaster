package com.rb.TableMaster.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OrderItemDTO(
        @PositiveOrZero
        Long id,

        @NotNull(message = "ID do item do menu é obrigatório")
        @Positive(message = "ID do item do menu deve ser positivo")
        Long menuItemId,

        String menuItemName, // Para exibição, não usado na criação

        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser positiva")
        Integer quantity,

        @NotNull(message = "Preço unitário é obrigatório")
        @Positive(message = "Preço unitário deve ser positivo")
        BigDecimal unitPrice
) {}