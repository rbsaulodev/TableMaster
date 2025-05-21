package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.model.User;

public class UserMapper {

    public static UserDTO toDTO(User user) {
        if (user == null) return null;

        return new UserDTO(
                user.getCpf(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setCpf(dto.cpf());
        user.setUsername(dto.username());
        user.setFullName(dto.fullName());
        user.setEmail(dto.email());
        user.setRole(dto.role());
        user.setActive(dto.active());
        user.setCreatedAt(dto.createdAt()); // normalmente JPA seta isso, cuidado ao persistir diretamente

        return user;
    }
}
