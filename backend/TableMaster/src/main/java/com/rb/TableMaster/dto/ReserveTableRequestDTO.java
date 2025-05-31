package com.rb.TableMaster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReserveTableRequestDTO {
    @NotNull(message = "O ID da mesa é obrigatório")
    @Positive(message = "O ID da mesa deve ser positivo")
    private Long tableId;

    @NotBlank(message = "O horário da reserva é obrigatório")
    @Pattern(regexp = "^([01]\\d|2[0-3]):([0-5]\\d)$", message = "O formato do horário deve ser HH:mm")
    private String reservedTime;
}