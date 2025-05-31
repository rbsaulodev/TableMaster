package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String token;
    private String username;
    private String fullName;
    private UserRole role;
    private String message;
    private String cpf;
}