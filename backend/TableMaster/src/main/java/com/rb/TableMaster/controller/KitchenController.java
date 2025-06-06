package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.service.KitchenService;
import com.rb.TableMaster.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CHEF', 'WAITER', 'ADMIN')")
public class KitchenController {

    private final KitchenService kitchenService;
    private final MenuItemService menuItemService;

    @GetMapping("/pending")
    public List<OrderItemDTO> getPendingItems() {
        return kitchenService.getPendingItems();
    }

    @GetMapping("/preparing")
    public List<OrderItemDTO> getPreparingItems() {
        return kitchenService.getPreparingItems();
    }

    @GetMapping("/ready")
    public List<OrderItemDTO> getReadyItems() {
        return kitchenService.getReadyItems();
    }

    @PatchMapping("/item/{itemId}/start-preparing")
    public OrderItemDTO startPreparingItem(@PathVariable Long itemId) {
        return kitchenService.startPreparing(itemId);
    }

    @PatchMapping("/item/{itemId}/mark-ready")
    public OrderItemDTO markItemAsReady(@PathVariable Long itemId) {
        return kitchenService.markAsReady(itemId);
    }

    @PatchMapping("/item/{itemId}/mark-delivered")
    public OrderItemDTO markItemAsDelivered(@PathVariable Long itemId) {
        return kitchenService.markAsDelivered(itemId);
    }

    @PatchMapping("/menu-item/{id}/toggle-availability")
    public MenuItemDTO toggleMenuItemAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return menuItemService.toggleMenuItemAvailability(id, available);
    }

    @GetMapping("/delivered")
    public List<OrderItemDTO> getDeliveredItems() {
        return kitchenService.getDeliveredItems();
    }
}