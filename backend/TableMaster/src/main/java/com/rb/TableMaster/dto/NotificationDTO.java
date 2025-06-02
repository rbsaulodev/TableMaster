package com.rb.TableMaster.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record NotificationDTO(

        @NotBlank(message = "O título é obrigatório")
        @Size(max = 100, message = "O título deve ter no máximo 100 caracteres")
        String title,

        @NotBlank(message = "A mensagem é obrigatória")
        @Size(max = 255, message = "A mensagem deve ter no máximo 255 caracteres")
        String message,

        @NotNull(message = "O timestamp é obrigatório")
        LocalDateTime timestamp,

        @NotNull(message = "O ID da mesa é obrigatório")
        @PositiveOrZero(message = "O ID da mesa deve ser positivo")
        Long tableId,

        @NotNull(message = "O número da mesa é obrigatório")
        @PositiveOrZero(message = "O número da mesa deve ser positivo")
        Integer tableNumber,

        @PositiveOrZero(message = "O ID do pedido deve ser positivo ou zero se presente")
        Long orderId,

        @PositiveOrZero(message = "O ID do item deve ser positivo ou zero se presente")
        Long itemId,

        @Size(max = 100, message = "O nome do item deve ter no máximo 100 caracteres")
        String itemName,

        // NOVOS CAMPOS: userName e itemsSummary
        @Size(max = 100, message = "O nome do usuário deve ter no máximo 100 caracteres")
        String userName,

        @Size(max = 255, message = "O resumo dos itens deve ter no máximo 255 caracteres")
        String itemsSummary
) {}