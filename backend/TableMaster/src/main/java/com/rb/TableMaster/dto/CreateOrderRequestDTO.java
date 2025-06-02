package com.rb.TableMaster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderRequestDTO(
        @NotNull(message = "O ID da mesa é obrigatório")
        @Positive(message = "O ID da mesa deve ser positivo")
        Long tableId,

        @NotBlank(message = "O CPF do usuário é obrigatório")
        String userCpf
) {}