package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.NotificationDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendOrderUpdate(OrderDTO order) {
        System.out.println("DEBUG WS Backend: Enviando OrderUpdate para: " + order.id() + " - Status: " + order.status());
        messagingTemplate.convertAndSend("/topic/orders", order);
    }

    public void sendOrderItemUpdate(OrderItemDTO item) {
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate para: " + item.id() + " - Qtd: " + item.quantity());
        messagingTemplate.convertAndSend("/topic/order-items", item);
    }

    public void sendTableUpdate(RestaurantTableDTO table) {
        System.out.println("DEBUG WS Backend: Enviando TableUpdate para: " + table.id() + " - Status: " + table.status());
        messagingTemplate.convertAndSend("/topic/tables", table);
    }

    public void sendOrderDeleted(Long orderId) {
        // Envia um objeto JSON simples com o ID e um flag de deleção
        String message = "{\"id\": " + orderId + ", \"deleted\": true}";
        System.out.println("DEBUG WS Backend: Enviando OrderDeleted para: " + orderId);
        messagingTemplate.convertAndSend("/topic/orders", message); // Use o mesmo tópico de orders
    }

    public void sendNotification(NotificationDTO notification) {
        System.out.println("DEBUG WS Backend: Enviando Notificação para /topic/notifications: " + notification.title());
        messagingTemplate.convertAndSend("/topic/notifications", notification); // <<< NOVO TÓPICO!
    }
}