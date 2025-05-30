package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin") // O RequestMapping mudou para /api/admin para agrupar tudo
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Endpoints administrativos para gestão de usuários, mesas e cardápio")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "Listar todos os usuários (paginação)")
    public ResponseEntity<Page<UserDTO>> findAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.findAllUsers(pageable));
    }

    @GetMapping("/users/{cpf}")
    @Operation(summary = "Buscar usuário por CPF")
    public ResponseEntity<UserDTO> findUserById(@PathVariable String cpf) {
        return ResponseEntity.ok(adminService.findUserById(cpf));
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED) // Adicionado HttpStatus.CREATED para clareza
    @Operation(summary = "Criar novo usuário")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
        UserDTO createdUser = adminService.createUser(userDTO);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequestUri() // Usar fromCurrentRequestUri() para o path correto
                .path("/{cpf}")
                .buildAndExpand(createdUser.cpf())
                .toUri();
        return ResponseEntity.created(location).body(createdUser);
    }

    @PutMapping("/users/{cpf}")
    @Operation(summary = "Atualizar usuário existente")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable String cpf,
            @Valid @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(adminService.updateUser(cpf, userDTO));
    }

    @DeleteMapping("/users/{cpf}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Adicionado HttpStatus.NO_CONTENT para clareza
    @Operation(summary = "Remover usuário")
    public ResponseEntity<Void> deleteUser(@PathVariable String cpf) {
        adminService.deleteUser(cpf);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{cpf}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Ativar usuário")
    public ResponseEntity<Void> activateUser(@PathVariable String cpf) {
        adminService.activateUser(cpf);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{cpf}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Desativar usuário")
    public ResponseEntity<Void> deactivateUser(@PathVariable String cpf) {
        adminService.deactivateUser(cpf);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/search")
    @Operation(summary = "Buscar usuários por filtros")
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminService.searchUsers(username, email, role));
    }

    @PostMapping("/tables")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar nova mesa")
    public ResponseEntity<RestaurantTableDTO> createTable(@Valid @RequestBody RestaurantTableDTO tableDTO) {
        RestaurantTableDTO createdTable = adminService.createTable(tableDTO);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(createdTable.id())
                .toUri();
        return ResponseEntity.created(location).body(createdTable);
    }

    @GetMapping("/tables")
    @Operation(summary = "Listar todas as mesas")
    public ResponseEntity<List<RestaurantTableDTO>> findAllTables() {
        return ResponseEntity.ok(adminService.findAllTables());
    }

    @PostMapping("/menu-items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar novo item do cardápio")
    public ResponseEntity<MenuItemDTO> createMenuItem(@Valid @RequestBody MenuItemDTO menuItemDTO) {
        MenuItemDTO createdMenuItem = adminService.createMenuItem(menuItemDTO);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(createdMenuItem.id())
                .toUri();
        return ResponseEntity.created(location).body(createdMenuItem);
    }

    @GetMapping("/menu-items")
    @Operation(summary = "Listar todos os itens do cardápio")
    public ResponseEntity<List<MenuItemDTO>> findAllMenuItems() {
        return ResponseEntity.ok(adminService.findAllMenuItems());
    }
}