package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.service.NotificationService;
import com.rb.TableMaster.service.OrderService;
import com.rb.TableMaster.service.RestaurantTableService;
import com.rb.TableMaster.service.WaiterService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waiter")
@AllArgsConstructor
@PreAuthorize("hasRole('WAITER') or hasRole('ADMIN')")
public class WaiterController {

    private final WaiterService waiterService;
    private final RestaurantTableService restaurantTableService;
    private final NotificationService notificationService;
    private final OrderService orderService;

    @GetMapping("/tables")
    public List<RestaurantTableDTO> getAllTables() {
        return waiterService.getAllTables();
    }

    @GetMapping("/orders/active")
    public List<OrderDTO> getActiveOrders() {
        return waiterService.getActiveOrders();
    }

    @GetMapping("/items/ready")
    public List<OrderItemDTO> getReadyItems() {
        return waiterService.getReadyItems();
    }

    @GetMapping("/notifications")
    public List<NotificationDTO> getNotifications() {
        return waiterService.getNotifications();
    }

    @PatchMapping("/order/{orderId}/pay")
    public OrderDTO processPayment(@PathVariable Long orderId, @RequestParam PaymentMethod paymentMethod) {
        return waiterService.processPayment(orderId, paymentMethod);
    }

    @PatchMapping("/item/{itemId}/deliver")
    public OrderItemDTO deliverItem(@PathVariable Long itemId) {
        return waiterService.deliverItem(itemId);
    }

    @DeleteMapping("/notifications/clear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearNotifications() {
        waiterService.clearNotifications();
    }

    @PatchMapping("/order/{orderId}/request-account")
    public ResponseEntity<OrderDTO> requestAccount(@PathVariable Long orderId) {
        OrderDTO updatedOrder = orderService.updateOrderStatusToUnpaid(orderId);
        return ResponseEntity.ok(updatedOrder);
    }

    @PatchMapping("/item/{orderItemId}/deliver")
    public ResponseEntity<Void> deliverOrderItem(@PathVariable Long orderItemId) {
        return ResponseEntity.ok().build();
    }
}