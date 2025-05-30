package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.dto.mapper.UserMapper;
import com.rb.TableMaster.exception.UserException;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import com.rb.TableMaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final RestaurantTableService restaurantTableService;
    private final MenuItemService menuItemService;

    @Transactional(readOnly = true)
    public Page<UserDTO> findAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(userMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO findUserById(String cpf) {
        return userRepository.findById(cpf)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new UserException("Usuário não encontrado com CPF: " + cpf));
    }

    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.existsByUsername(userDTO.username())) {
            throw new UserException("Username já está em uso");
        }
        if (userRepository.existsByEmail(userDTO.email())) {
            throw new UserException("Email já está cadastrado");
        }
        if (userDTO.password() == null || userDTO.password().isBlank()) {
            throw new UserException("Senha é obrigatória");
        }

        User user = userMapper.toEntity(userDTO);
        user.setPassword(passwordEncoder.encode(userDTO.password()));

        return userMapper.toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUser(String cpf, UserDTO userDTO) {
        User user = userRepository.findById(cpf)
                .orElseThrow(() -> new UserException("Usuário não encontrado com CPF: " + cpf));

        if (!user.getUsername().equals(userDTO.username())) {
            if (userRepository.existsByUsername(userDTO.username())) {
                throw new UserException("Novo username já está em uso");
            }
            user.setUsername(userDTO.username());
        }

        if (!user.getEmail().equals(userDTO.email())) {
            if (userRepository.existsByEmail(userDTO.email())) {
                throw new UserException("Novo email já está cadastrado");
            }
            user.setEmail(userDTO.email());
        }

        user.setFullName(userDTO.fullName());

        try {
            user.setRole(UserRole.valueOf(userDTO.role()));
        } catch (IllegalArgumentException e) {
            throw new UserException("Perfil informado é inválido");
        }
        return userMapper.toDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(String cpf) {
        if (!userRepository.existsById(cpf)) {
            throw new UserException("Usuário não encontrado com CPF: " + cpf);
        }
        userRepository.deleteById(cpf);
    }

    @Transactional
    public void activateUser(String cpf) {
        User user = userRepository.findById(cpf)
                .orElseThrow(() -> new UserException("Usuário não encontrado com CPF: " + cpf));
        user.setActive(true);
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(String cpf) {
        User user = userRepository.findById(cpf)
                .orElseThrow(() -> new UserException("Usuário não encontrado com CPF: " + cpf));
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> searchUsers(String username, String email, String role) {
        UserRole roleEnum = null;
        if (role != null) {
            try {
                roleEnum = UserRole.valueOf(role);
            } catch (IllegalArgumentException e) {
                throw new UserException("Perfil informado é inválido");
            }
        }

        return userRepository.findByUsernameContainingOrEmailContainingOrRole(
                        username != null ? username : "",
                        email != null ? email : "",
                        roleEnum)
                .stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RestaurantTableDTO createTable(RestaurantTableDTO tableDTO) {
        return restaurantTableService.create(tableDTO);
    }

    @Transactional(readOnly = true)
    public List<RestaurantTableDTO> findAllTables() {
        return restaurantTableService.listAll();
    }

    @Transactional
    public MenuItemDTO createMenuItem(MenuItemDTO menuItemDTO) {
        return menuItemService.create(menuItemDTO);
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> findAllMenuItems() {
        return menuItemService.listAll();
    }
}