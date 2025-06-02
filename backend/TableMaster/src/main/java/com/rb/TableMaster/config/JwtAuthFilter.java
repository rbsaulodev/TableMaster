package com.rb.TableMaster.config;

import com.rb.TableMaster.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // --- Adição importante: Ignorar requisições para caminhos públicos (incluindo WebSocket) ---
        // Se a requisição for para /api/auth/**, /h2-console/**, /ws/**, /api/menu/** ou a raiz "/",
        // não tente validar o JWT. O SecurityFilterChain já cuidará do permitAll.
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/api/auth/") ||
                requestURI.startsWith("/h2-console/") ||
                requestURI.startsWith("/ws/") || // Caminho para WebSocket
                requestURI.startsWith("/api/menu/") || // Caminho para menu público
                requestURI.equals("/") || // A raiz da aplicação
                requestURI.equals("/favicon.ico")) { // O ícone de favoritos
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Se o cabeçalho de autenticação não existe ou não começa com "Bearer ",
        // passa a requisição para o próximo filtro.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extrai o token JWT (removendo "Bearer ")
        jwt = authHeader.substring(7);
        // Extrai o nome de usuário (ou CPF, dependendo da sua implementação) do token
        username = jwtService.extractUsername(jwt);

        // Se o nome de usuário foi extraído e não há autenticação no contexto de segurança atual,
        // tenta autenticar o usuário.
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Carrega os detalhes do usuário usando o UserDetailsService
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // Valida o token JWT com base nos detalhes do usuário
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // Cria um token de autenticação e o define no SecurityContextHolder
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Credenciais são nulas porque já foram validadas pelo JWT
                        userDetails.getAuthorities() // Autoridades/roles do usuário
                );
                // Adiciona detalhes da requisição ao token de autenticação
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                // Define o token de autenticação no contexto de segurança
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        // Continua a cadeia de filtros
        filterChain.doFilter(request, response);
    }
}