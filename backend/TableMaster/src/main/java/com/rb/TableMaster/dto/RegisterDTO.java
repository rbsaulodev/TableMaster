package com.rb.TableMaster.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterDTO(
        @NotBlank(message = "CPF é obrigatório")
        String cpf,

        @NotBlank(message = "Username é obrigatório")
        String username,

        @NotBlank(message = "Password é obrigatória")
        String password,

        @NotBlank(message = "Nome completo é obrigatório")
        String fullName,

        @Email(message = "Email deve ser válido")
        String email
) {}