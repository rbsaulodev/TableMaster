package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.service.WaiterService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waiter")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class WaiterController {

    private final WaiterService waiterService;

    @GetMapping("/tables")
    public List<RestaurantTableDTO> getAllTables() {
        return waiterService.getAllTables();
    }

    @GetMapping("/comandas/open")
    public List<OrderDTO> getOpenComandas() {
        return waiterService.getAllOpenComandas();
    }

    @GetMapping("/comandas/unpaid")
    public List<OrderDTO> getUnpaidComandas() {
        return waiterService.getAllUnpaidComandas();
    }

    @GetMapping("/items/ready")
    public List<OrderItemDTO> getReadyItems() {
        return waiterService.getReadyItems();
    }

    @GetMapping("/notifications")
    public List<NotificationDTO> getNotifications() {
        return waiterService.getNotifications();
    }

    @PatchMapping("/comanda/{comandaId}/pay")
    public OrderDTO processPayment(@PathVariable Long comandaId, @RequestParam PaymentMethod paymentMethod) {
        return waiterService.processPayment(comandaId, paymentMethod);
    }

    @PatchMapping("/item/{itemId}/deliver")
    public OrderItemDTO deliverItem(@PathVariable Long itemId) {
        return waiterService.deliverItem(itemId);
    }
}