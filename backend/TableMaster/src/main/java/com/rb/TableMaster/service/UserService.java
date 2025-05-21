package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.dto.mapper.UserMapper;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public List<UserDTO> list() {
        return userRepository.findAll().stream()
                .map(UserMapper::toDTO)
                .toList();
    }

    public UserDTO findByCpf(@NotNull String cpf) {
        return userRepository.findById(cpf)
                .map(UserMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));
    }

    public UserDTO create(@Valid @NotNull UserDTO userDTO) {
        User entity = userMapper.toEntity(userDTO);
        User saved = userRepository.save(entity);
        return userMapper.toDTO(saved);
    }

    public UserDTO update(@Valid @NotNull UserDTO userDTO, @NotNull String cpf) {
        return userRepository.findById(cpf)
                .map(recordFound -> {
                    recordFound.setUsername(userDTO.username());
                    recordFound.setFullName(userDTO.fullName());
                    recordFound.setEmail(userDTO.email());
                    recordFound.setRole(userDTO.role());
                    recordFound.setActive(userDTO.active());
                    User updated = userRepository.save(recordFound);
                    return userMapper.toDTO(updated);
                })
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));
    }

    public void delete(@NotNull String cpf) {
        User user = userRepository.findById(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));
        userRepository.delete(user);
    }
}
