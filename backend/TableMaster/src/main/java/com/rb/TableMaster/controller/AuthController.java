package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.AuthResponseDTO;
import com.rb.TableMaster.dto.LoginDTO;
import com.rb.TableMaster.dto.RegisterDTO;
import com.rb.TableMaster.exception.AuthenticationException;
import com.rb.TableMaster.exception.UserException;
import com.rb.TableMaster.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterDTO registerDTO) {
        try {
            AuthResponseDTO response = authService.register(registerDTO);
            return ResponseEntity.ok(response);
        } catch (UserException e) {
            return ResponseEntity.badRequest()
                    .body(AuthResponseDTO.builder()
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            AuthResponseDTO response = authService.login(loginDTO);
            return ResponseEntity.ok(response);
        } catch (UserException e) {
            return ResponseEntity.badRequest()
                    .body(AuthResponseDTO.builder()
                            .message(e.getMessage())
                            .build());
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponseDTO.builder()
                            .message(e.getMessage())
                            .build());
        }
    }
}