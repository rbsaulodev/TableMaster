package com.rb.TableMaster.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;
import java.util.List;

public record OrderDTO(
        @PositiveOrZero
        Long id,

        @NotNull(message = "ID da mesa é obrigatório")
        @Positive(message = "ID da mesa deve ser positivo")
        Long tableId,

        LocalDateTime createdAt, // Será preenchido automaticamente se null

        @Valid
        List<OrderItemDTO> items
) {}