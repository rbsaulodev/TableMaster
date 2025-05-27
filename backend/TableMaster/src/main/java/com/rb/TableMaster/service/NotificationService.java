package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.model.OrderItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
public class NotificationService {

    private final ConcurrentLinkedQueue<NotificationDTO> notifications = new ConcurrentLinkedQueue<>();

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

    public void clearNotifications() {
        notifications.clear();
    }
}