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

        @NotNull(message = "O ID do item é obrigatório")
        @PositiveOrZero(message = "O ID do item deve ser positivo")
        Long itemId,

        @NotBlank(message = "O nome do item é obrigatório")
        @Size(max = 100, message = "O nome do item deve ter no máximo 100 caracteres")
        String itemName
) {}
