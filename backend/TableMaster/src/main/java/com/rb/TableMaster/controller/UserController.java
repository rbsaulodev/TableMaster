package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.UserDTO;
import com.rb.TableMaster.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> list() {
        List<UserDTO> users = userService.list();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<UserDTO> findByCpf(@PathVariable @NotBlank String cpf) {
        UserDTO user = userService.findByCpf(cpf);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<UserDTO> create(@RequestBody @Valid @NotNull UserDTO userDTO) {
        UserDTO createdUser = userService.create(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<UserDTO> update(
            @PathVariable @NotBlank String cpf,
            @RequestBody @Valid @NotNull UserDTO userDTO) {
        UserDTO updatedUser = userService.update(cpf, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/{cpf}")
    public ResponseEntity<UserDTO> updatePartial(
            @PathVariable @NotBlank String cpf,
            @RequestBody @NotNull UserDTO partialUserDTO) {
        UserDTO updatedUser = userService.updatePartial(cpf, partialUserDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{cpf}")
    public ResponseEntity<Void> delete(@PathVariable @NotBlank String cpf) {
        userService.delete(cpf);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{cpf}/deactivate")
    public ResponseEntity<UserDTO> deactivate(@PathVariable @NotBlank String cpf) {
        UserDTO deactivatedUser = userService.deactivate(cpf);
        return ResponseEntity.ok(deactivatedUser);
    }

    @PatchMapping("/{cpf}/activate")
    public ResponseEntity<UserDTO> activate(@PathVariable @NotBlank String cpf) {
        UserDTO activatedUser = userService.activate(cpf);
        return ResponseEntity.ok(activatedUser);
    }
}