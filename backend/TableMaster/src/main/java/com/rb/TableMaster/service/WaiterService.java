package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.model.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class WaiterService {

    private final OrderService orderService;
    private final RestaurantTableService tableService;
    private final KitchenService kitchenService;
    private final NotificationService notificationService;

    public List<RestaurantTableDTO> getAllTables() {
        return tableService.list();
    }

    public List<OrderDTO> getAllOpenComandas() {
        return orderService.findOpenOrders();
    }

    public List<OrderDTO> getAllUnpaidComandas() {
        return orderService.findUnpaidOrders();
    }

    public List<OrderItemDTO> getReadyItems() {
        return kitchenService.getReadyItems();
    }

    public List<NotificationDTO> getNotifications() {
        return notificationService.getUnreadNotifications();
    }

    public OrderDTO processPayment(Long comandaId, PaymentMethod paymentMethod) {
        return orderService.payOrder(comandaId, paymentMethod);
    }

    public OrderItemDTO deliverItem(Long itemId) {
        return kitchenService.markAsDelivered(itemId);
    }
}