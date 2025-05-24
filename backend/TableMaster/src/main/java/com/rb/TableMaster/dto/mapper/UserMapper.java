package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return new UserDTO(
                user.getCpf(),
                user.getUsername(),
                null,
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setCpf(dto.cpf());
        user.setUsername(dto.username());

        if (dto.password() != null) {
            user.setPassword(dto.password());
        }

        user.setFullName(dto.fullName());
        user.setEmail(dto.email());

        if (dto.role() != null) {
            user.setRole(UserRole.valueOf(dto.role()));
        }

        if (dto.active() != null) {
            user.setActive(dto.active());
        } else {
            user.setActive(true);
        }

        return user;
    }
}