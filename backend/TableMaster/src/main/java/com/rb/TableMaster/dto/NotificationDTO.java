package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.model.enums.NotificationType; // Importar o novo enum
import jakarta.validation.constraints.*;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NotificationDTO(

        @Positive(message = "O ID da notificação deve ser positivo, se informado.")
        Long id,

        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 100, message = "O título deve ter no máximo 100 caracteres.")
        String title,

        @NotBlank(message = "A mensagem é obrigatória.")
        @Size(max = 255, message = "A mensagem deve ter no máximo 255 caracteres.")
        String message,

        @NotNull(message = "O timestamp é obrigatório.")
        @PastOrPresent(message = "O timestamp deve ser uma data/hora passada ou presente.")
        LocalDateTime timestamp,

        @NotNull(message = "O ID da mesa é obrigatório.")
        @Positive(message = "O ID da mesa deve ser um número positivo.")
        Long tableId,

        @NotNull(message = "O número da mesa é obrigatório.")
        @Positive(message = "O número da mesa deve ser um número positivo.")
        Integer tableNumber,

        @Positive(message = "O ID do pedido deve ser positivo, se informado.")
        Long orderId,

        @Positive(message = "O ID do item deve ser positivo, se informado.")
        Long itemId,

        @Size(max = 100, message = "O nome do item deve ter no máximo 100 caracteres, se informado.")
        String itemName,

        @Size(max = 100, message = "O nome do usuário deve ter no máximo 100 caracteres, se informado.")
        String userName,

        @Size(max = 255, message = "O resumo dos itens deve ter no máximo 255 caracteres, se informado.")
        String itemsSummary,

        PaymentMethod requestedPaymentMethod,
        @NotNull(message = "O tipo de notificação é obrigatório.")
        NotificationType notificationType
) {}