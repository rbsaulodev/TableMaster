package com.rb.TableMaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
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
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;
import java.util.Arrays;
import java.util.List;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

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
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/menu/**").permitAll()

                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/app/**").permitAll()

                        // Rotas que exigem roles específicas
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/waiter/**").hasRole("WAITER")
                        .requestMatchers("/api/chef/**").hasRole("CHEF")
                        .requestMatchers("/api/kitchen/**").hasAnyRole("CHEF", "WAITER", "ADMIN")

                        // Rotas do cliente
                        .requestMatchers("/api/client/**").hasRole("CUSTOMER")
                        // PERMITIR ATUALIZAÇÃO DE ITENS DE PEDIDO PARA CUSTOMER (PATCH)
                        .requestMatchers(HttpMethod.PATCH, "/api/order-items/**").hasRole("CUSTOMER")
                        // PERMITIR DELEÇÃO DE ITENS DE PEDIDO PARA CUSTOMER (DELETE)
                        .requestMatchers(HttpMethod.DELETE, "/api/order-items/**").hasRole("CUSTOMER")
                        // PERMITIR CRIAÇÃO DE ITENS DE PEDIDO PARA CUSTOMER (POST)
                        .requestMatchers(HttpMethod.POST, "/api/order-items").hasRole("CUSTOMER")
                        // PERMITIR CRIAÇÃO DE RASCUNHO DE PEDIDO PARA CUSTOMER (POST)
                        .requestMatchers(HttpMethod.POST, "/api/orders/create-draft").hasRole("CUSTOMER")
                        // PERMITIR FINALIZAÇÃO DE PEDIDO PARA CUSTOMER (PATCH)
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/{orderId}/confirm").hasRole("CUSTOMER")


                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
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