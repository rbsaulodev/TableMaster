package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.AuthResponseDTO;
import com.rb.TableMaster.dto.LoginDTO;
import com.rb.TableMaster.dto.RegisterDTO;
import com.rb.TableMaster.exception.AuthenticationException;
import com.rb.TableMaster.exception.UserException;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import com.rb.TableMaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponseDTO register(RegisterDTO registerDTO) throws UserException {
        if (userRepository.existsByUsername(registerDTO.getUsername())) {
            throw new UserException("Username já está em uso");
        }

        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new UserException("Email já está em uso");
        }

        if (userRepository.existsById(registerDTO.getCpf())) {
            throw new UserException("CPF já cadastrado");
        }

        User user = User.builder()
                .cpf(registerDTO.getCpf())
                .username(registerDTO.getUsername())
                .password(passwordEncoder.encode(registerDTO.getPassword()))
                .fullName(registerDTO.getFullName())
                .email(registerDTO.getEmail())
                .role(registerDTO.getRole())
                .active(true)
                .build();

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return AuthResponseDTO.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .message("Registro realizado com sucesso")
                .build();
    }

    public AuthResponseDTO login(LoginDTO loginDTO) throws AuthenticationException {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = (User) authentication.getPrincipal();
            String jwtToken = jwtService.generateToken(user);

            return AuthResponseDTO.builder()
                    .token(jwtToken)
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .message("Login realizado com sucesso")
                    .build();

        } catch (Exception e) {
            throw new AuthenticationException("Credenciais inválidas");
        }
    }
}