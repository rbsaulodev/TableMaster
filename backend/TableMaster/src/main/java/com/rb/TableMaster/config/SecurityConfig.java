package com.rb.TableMaster.config;

import com.rb.TableMaster.service.JwtService;
import com.rb.TableMaster.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService customUserDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers(
                                AntPathRequestMatcher.antMatcher("/h2-console/**"),
                                AntPathRequestMatcher.antMatcher("/ws/**"),
                                AntPathRequestMatcher.antMatcher("/api/auth/**")
                        )
                        .disable()
                )
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.disable())
                )
                .authorizeHttpRequests(auth -> auth
                        // --- 1. Permissões Públicas (não exigem autenticação) ---
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Pré-voo CORS
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/menu/**").permitAll() // Menu é público para todos
                        .requestMatchers("/ws/**").permitAll() // WebSocket handshake e upgrades
                        .requestMatchers("/topic/**").permitAll() // Tópicos WebSocket para subscriptions
                        .requestMatchers("/app/**").permitAll() // Destinos WebSocket para enviar mensagens

                        // --- 2. Permissões Específicas por Role (autenticadas) ---

                        // --- Rotas do Cliente (CUSTOMER) ---
                        .requestMatchers("/api/client/**").hasRole("CUSTOMER")

                        // Rotas de Pedido que clientes podem usar (POST/PATCH de itens, confirmação)
                        .requestMatchers(HttpMethod.POST, "/api/orders/create-draft").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/{orderId}/confirm").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/order-items").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.PATCH, "/api/order-items/**").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.DELETE, "/api/order-items/**").hasRole("CUSTOMER")

                        // --- Rotas de Admin ---
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // --- Rotas de Garçom (WAITER) ---
                        .requestMatchers("/api/waiter/**").hasRole("WAITER")
                        .requestMatchers(HttpMethod.POST, "/api/orders/create-for-table").hasAnyRole("ADMIN", "WAITER")
                        .requestMatchers(HttpMethod.PUT, "/api/table/{id}").hasAnyRole("ADMIN", "WAITER")
                        .requestMatchers(HttpMethod.PATCH, "/api/waiter/order/{id}/pay").hasRole("WAITER")

                        // --- Rotas de Chef (CHEF) ---
                        .requestMatchers("/api/chef/**").hasRole("CHEF")

                        // --- Rotas da Cozinha (visualização permitida para Chef e Garçom) ---
                        .requestMatchers(HttpMethod.GET, "/api/kitchen/pending").hasAnyRole("CHEF", "WAITER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/kitchen/preparing").hasAnyRole("CHEF", "WAITER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/kitchen/ready").hasAnyRole("CHEF", "WAITER", "ADMIN")

                        // --- **CORREÇÃO AQUI**: Permite Chef e Garçom mudar status de item na cozinha ---
                        .requestMatchers(HttpMethod.PATCH, "/api/kitchen/item/**").hasAnyRole("CHEF", "WAITER") // <-- Adicionado "WAITER"

                        // --- Rotas de Pedidos (Gerais) ---
                        .requestMatchers(HttpMethod.GET, "/api/orders/paid").hasAnyRole("ADMIN", "WAITER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/table/**").hasAnyRole("ADMIN", "WAITER", "CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/{id}").hasAnyRole("ADMIN", "WAITER", "CHEF", "CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/orders").hasAnyRole("ADMIN", "WAITER", "CHEF")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/{orderId}/items").hasAnyRole("ADMIN", "WAITER", "CUSTOMER") // Permite Garçom adicionar itens a pedido existente
                        .requestMatchers(HttpMethod.POST, "/api/orders/{orderId}/items").hasAnyRole("ADMIN", "WAITER", "CUSTOMER") // Se usar POST para adicionar novos itens

                        // --- 3. Qualquer outra requisição que não foi explicitamente permitida ou negada, exige autenticação ---
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(customUserDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder());
        return authenticationProvider;
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}