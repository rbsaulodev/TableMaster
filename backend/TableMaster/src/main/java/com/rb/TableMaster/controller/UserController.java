package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> listAll() {
        return ResponseEntity.ok(userService.list());
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<UserDTO> findByCpf(@PathVariable @NotBlank String cpf) {
        return ResponseEntity.ok(userService.findByCpf(cpf));
    }

    @PostMapping
    public ResponseEntity<UserDTO> create(@RequestBody @Valid UserDTO userDTO) {
        UserDTO created = userService.create(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<UserDTO> update(
            @PathVariable @NotBlank String cpf,
            @RequestBody @Valid UserDTO userDTO
    ) {
        return ResponseEntity.ok(userService.update(userDTO, cpf));
    }

    @DeleteMapping("/{cpf}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotBlank String cpf) {
        userService.delete(cpf);
    }
}
