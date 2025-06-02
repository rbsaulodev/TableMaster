// src/main/java/com/rb/TableMaster/dto/RestaurantTableDTO.java
package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.TableStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record RestaurantTableDTO(
        @PositiveOrZero
        Long id,

        @Positive(message = "O número da mesa deve ser positivo")
        int number,

        @NotNull(message = "O status da mesa é obrigatório")
        TableStatus status,

        @Positive(message = "A capacidade da mesa deve ser maior que zero")
        int capacity,

        List<OrderDTO> orders
) {
}