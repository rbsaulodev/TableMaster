package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WaiterService {
    private final OrderService orderService;
    private final RestaurantTableService tableService;
    private final OrderItemService orderItemService;
    private final NotificationService notificationService;
    private final WebSocketController webSocketController;

    public List<OrderDTO> getActiveOrders() {
        return orderService.getActiveOrders();
    }

    public List<OrderItemDTO> getReadyItems() {
        return orderItemService.getItemsByStatus(OrderItemStatus.READY);
    }

    public List<NotificationDTO> getNotifications() {
        return notificationService.getUnreadNotifications();
    }

    @Transactional
    public OrderItemDTO deliverItem(Long itemId) {
        OrderItemDTO item = orderItemService.updateItemStatus(itemId, OrderItemStatus.DELIVERED);
        notificationService.markAsRead(itemId);
        webSocketController.sendOrderItemUpdate(item);
        return item;
    }

    @Transactional
    public OrderDTO processPayment(Long orderId, PaymentMethod paymentMethod) {
        OrderDTO order = orderService.payOrder(orderId, paymentMethod);
        webSocketController.sendOrderUpdate(order);
        return order;
    }

    public List<RestaurantTableDTO> getAllTables() {
        return tableService.list();
    }

    public void clearNotifications() {
        notificationService.clearNotifications();
    }
}
