package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank(message = "CPF é obrigatório")
    private String cpf;

    @NotBlank(message = "Username é obrigatório")
    private String username;

    @NotBlank(message = "Password é obrigatória")
    private String password;

    @NotBlank(message = "Nome completo é obrigatório")
    private String fullName;

    @Email(message = "Email deve ser válido")
    private String email;

    @NotNull(message = "Role é obrigatória")
    private UserRole role;
}