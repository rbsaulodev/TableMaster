package com.rb.TableMaster.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record UserDTO(
        @NotBlank(message = "CPF é obrigatório")
        @Pattern(regexp = "^\\d{11}$", message = "CPF deve conter 11 dígitos numéricos")
        String cpf,

        @NotBlank(message = "Nome de usuário é obrigatório")
        @Size(min = 3, max = 50, message = "Nome de usuário deve ter entre 3 e 50 caracteres")
        String username,

        @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
        String password,

        @NotBlank(message = "Nome completo é obrigatório")
        String fullName,

        @Email(message = "E-mail deve ser válido")
        String email,

        @NotBlank(message = "Perfil é obrigatório")
        String role,

        Boolean active,

        LocalDateTime createdAt
) {
}