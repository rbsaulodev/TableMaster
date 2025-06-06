package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.NotificationDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper; // Injetar ObjectMapper

    public void sendOrderUpdate(OrderDTO order) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(order);
            logger.debug("DEBUG WS Backend: Enviando OrderUpdate para: {} - Status: {}. Payload: {}", order.id(), order.status(), jsonPayload);
            messagingTemplate.convertAndSend("/topic/orders", order);
        } catch (JsonProcessingException e) {
            logger.error("Erro ao serializar OrderDTO para JSON no WebSocket: {}", e.getMessage());
        }
    }

    public void sendOrderItemUpdate(OrderItemDTO item) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(item);
            logger.debug("DEBUG WS Backend: Enviando OrderItemUpdate para: {} - Qtd: {}. Status: {}. Payload: {}", item.id(), item.quantity(), item.status(), jsonPayload);
            messagingTemplate.convertAndSend("/topic/order-items", item);
        } catch (JsonProcessingException e) {
            logger.error("Erro ao serializar OrderItemDTO para JSON no WebSocket: {}", e.getMessage());
        }
    }

    public void sendTableUpdate(RestaurantTableDTO table) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(table);
            logger.debug("DEBUG WS Backend: Enviando TableUpdate para: {} - Status: {}. Payload: {}", table.id(), table.status(), jsonPayload);
            messagingTemplate.convertAndSend("/topic/tables", table);
        } catch (JsonProcessingException e) {
            logger.error("Erro ao serializar RestaurantTableDTO para JSON no WebSocket: {}", e.getMessage());
        }
    }

    public void sendOrderDeleted(Long orderId) {
        String message = "{\"id\": " + orderId + ", \"deleted\": true}";
        logger.debug("DEBUG WS Backend: Enviando OrderDeleted para: {}. Payload: {}", orderId, message);
        messagingTemplate.convertAndSend("/topic/orders", message);
    }

    public void sendNotification(NotificationDTO notification) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(notification);
            logger.debug("DEBUG WS Backend: Enviando Notificação para /topic/notifications: {}. Payload: {}", notification.title(), jsonPayload);
            messagingTemplate.convertAndSend("/topic/notifications", notification);
        } catch (JsonProcessingException e) {
            logger.error("Erro ao serializar NotificationDTO para JSON no WebSocket: {}", e.getMessage());
        }
    }

    public void sendAccountRequestNotification(NotificationDTO notificationDTO) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(notificationDTO);
            logger.debug("DEBUG WS Backend: Enviando Notificação de Solicitação de Conta: ID {} para Pedido {}. Payload: {}", notificationDTO.id(), notificationDTO.orderId(), jsonPayload);
            messagingTemplate.convertAndSend("/topic/notifications/account-requests", notificationDTO);
        } catch (JsonProcessingException e) {
            logger.error("Erro ao serializar NotificationDTO para JSON no WebSocket: {}", e.getMessage());
        }
    }
}