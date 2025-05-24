package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.dto.mapper.UserMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.stream.Collectors;

@Validated
@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<UserDTO> list() {
        return userRepository.findAll().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    public UserDTO findByCpf(@NotNull @NotBlank String cpf) {
        return userRepository.findByCpf(cpf)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));
    }

    @Transactional
    public UserDTO create(@Valid @NotNull UserDTO userDTO) {
        if (userRepository.existsById(userDTO.cpf())) {
            throw new IllegalArgumentException("Usuário com CPF " + userDTO.cpf() + " já existe");
        }

        User entity = userMapper.toEntity(userDTO);
        User saved = userRepository.save(entity);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO update(@NotNull @NotBlank String cpf, @Valid @NotNull UserDTO userDTO) {
        User existingUser = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        User updatedUser = userMapper.toEntity(userDTO);
        updatedUser.setCpf(cpf);

        User saved = userRepository.save(updatedUser);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO updatePartial(@NotNull @NotBlank String cpf, @NotNull UserDTO partialUserDTO) {
        User existingUser = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        if (partialUserDTO.username() != null) {
            existingUser.setUsername(partialUserDTO.username());
        }

        if (partialUserDTO.password() != null) {
            existingUser.setPassword(partialUserDTO.password());
        }

        if (partialUserDTO.fullName() != null) {
            existingUser.setFullName(partialUserDTO.fullName());
        }

        if (partialUserDTO.email() != null) {
            existingUser.setEmail(partialUserDTO.email());
        }

        if (partialUserDTO.role() != null) {
            existingUser.setRole(UserRole.valueOf(partialUserDTO.role()));
        }

        if (partialUserDTO.active() != null) {
            existingUser.setActive(partialUserDTO.active());
        }

        User saved = userRepository.save(existingUser);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public void delete(@NotNull @NotBlank String cpf) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));
        userRepository.delete(user);
    }

    @Transactional
    public UserDTO deactivate(@NotNull @NotBlank String cpf) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        user.setActive(false);
        User saved = userRepository.save(user);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO activate(@NotNull @NotBlank String cpf) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        user.setActive(true);
        User saved = userRepository.save(user);
        return userMapper.toDTO(saved);
    }
}