package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.model.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ConcurrentLinkedQueue<NotificationDTO> notifications = new ConcurrentLinkedQueue<>();
    private final OrderItemService orderItemService;

    public void notifyItemReady(Long itemId) {
        OrderItem item = orderItemService.findEntityById(itemId);

        NotificationDTO notification = new NotificationDTO(
                "Item Pronto",
                String.format("Item %s da mesa %d está pronto para entrega",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getId(),
                item.getMenuItem().getName()
        );

        notifications.offer(notification);
        log.info("Notificação criada - Item pronto: {}", notification.message());
    }

    public void notifyNewOrderItem(Long itemId) {
        OrderItem item = orderItemService.findEntityById(itemId);

        NotificationDTO notification = new NotificationDTO(
                "Novo Pedido",
                String.format("Cliente da mesa %d pediu: %s",
                        item.getOrder().getTable().getNumber(),
                        item.getMenuItem().getName()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getId(),
                item.getMenuItem().getName()
        );

        notifications.offer(notification);
        log.info("Notificação criada - Novo pedido: {}", notification.message());
    }

    public void notifyItemInPreparation(Long itemId) {
        OrderItem item = orderItemService.findEntityById(itemId);

        NotificationDTO notification = new NotificationDTO(
                "Item em Preparo",
                String.format("Item %s da mesa %d está sendo preparado na cozinha",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getId(),
                item.getMenuItem().getName()
        );

        notifications.offer(notification);
        log.info("Notificação criada - Item em preparo: {}", notification.message());
    }

    public void notifyItemReady(OrderItem item) {
        NotificationDTO notification = new NotificationDTO(
                "Item Pronto",
                String.format("Item %s da mesa %d está pronto para entrega",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getId(),
                item.getMenuItem().getName()
        );

        notifications.offer(notification);
        log.info("Notificação criada: {}", notification.message());
    }

    public List<NotificationDTO> getUnreadNotifications() {
        List<NotificationDTO> unread = new ArrayList<>(notifications);
        notifications.clear();
        return unread;
    }

    public void markAsRead(Long itemId) {
        notifications.removeIf(notification ->
                notification.itemId() != null && notification.itemId().equals(itemId));
        log.info("Notificação marcada como lida para item: {}", itemId);
    }

    public void clearNotifications() {
        notifications.clear();
        log.info("Todas as notificações foram limpas");
    }

    public int getNotificationCount() {
        return notifications.size();
    }
}