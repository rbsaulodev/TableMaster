package com.rb.TableMaster.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Habilita o suporte a mensagens WebSocket com um Message Broker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita um broker simples baseado em memória.
        // Mensagens para destinos que começam com "/topic" serão roteadas para o broker.
        config.enableSimpleBroker("/topic");
        // Define o prefixo para os destinos das mensagens enviadas do cliente para a aplicação.
        // Ex: cliente envia para /app/send-message, a aplicação recebe em @MessageMapping("/send-message")
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registra o endpoint WebSocket que os clientes usarão para se conectar.
        // Os clientes se conectarão via "ws://localhost:8080/ws"
        registry.addEndpoint("/ws")
                // Permite conexões de qualquer origem. Em produção, considere restringir.
                .setAllowedOriginPatterns("*")
                // Habilita SockJS para fallback em navegadores que não suportam WebSocket nativamente.
                .withSockJS();
    }
}