package com.rb.TableMaster.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderItemRequest(
        @NotNull(message = "O ID do item do menu é obrigatório")
        @Positive(message = "O ID do item do menu deve ser positivo")
        Long menuItemId,

        @NotNull(message = "A quantidade é obrigatória")
        @Positive(message = "A quantidade deve ser positiva")
        Integer quantity
) {}