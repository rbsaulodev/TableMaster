package com.rb.TableMaster;

import com.rb.TableMaster.dto.LoginDTO;
import com.rb.TableMaster.exception.AuthenticationException;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import com.rb.TableMaster.repository.UserRepository;
import com.rb.TableMaster.service.AuthService;
import com.rb.TableMaster.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager; // Mockar o authenticationManager

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginDTO loginDTO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Inicializa os mocks

        testUser = User.builder()
                .cpf("12345678900")
                .username("cliente1")
                .password(new BCryptPasswordEncoder().encode("clientepass"))
                .fullName("Cliente Teste")
                .email("cliente@test.com")
                .role(UserRole.CUSTOMER)
                .active(true)
                .build();

        loginDTO = new LoginDTO("cliente1", "clientepass");
    }

    @Test
    void login_Success() {
        Authentication mockAuthentication = mock(Authentication.class);
        when(mockAuthentication.getPrincipal()).thenReturn(testUser); // Retorna o UserDetails
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuthentication);

        when(jwtService.generateToken(any(User.class))).thenReturn("fake.jwt.token");

        try {
            authService.login(loginDTO);
        } catch (AuthenticationException e) {
            fail("Login should not throw AuthenticationException");
        }

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, times(1)).generateToken(testUser);
    }

    @Test
    void login_InvalidCredentials() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));
        assertThrows(AuthenticationException.class, () -> authService.login(loginDTO));
        verify(jwtService, never()).generateToken(any(User.class));
    }
}