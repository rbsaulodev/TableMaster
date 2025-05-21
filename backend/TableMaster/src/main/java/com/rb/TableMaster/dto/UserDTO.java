package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.UserRole;

import java.time.LocalDateTime;

public record UserDTO(
        String cpf,
        String username,
        String fullName,
        String email,
        UserRole role,
        boolean active,
        LocalDateTime createdAt
) {}
