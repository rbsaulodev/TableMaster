package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.service.KitchenService;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
@AllArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CHEF') or hasRole('ADMIN')")
public class KitchenController {

    private final KitchenService kitchenService;

    @GetMapping("/items/pending")
    public List<OrderItemDTO> getPendingItems() {
        return kitchenService.getPendingItems();
    }

    @GetMapping("/items/preparing")
    public List<OrderItemDTO> getPreparingItems() {
        return kitchenService.getPreparingItems();
    }

    @GetMapping("/items/ready")
    public List<OrderItemDTO> getReadyItems() {
        return kitchenService.getReadyItems();
    }

    @PatchMapping("/item/{itemId}/start-preparing")
    public OrderItemDTO startPreparing(@PathVariable Long itemId) {
        return kitchenService.startPreparing(itemId);
    }

    @PatchMapping("/item/{itemId}/mark-ready")
    public OrderItemDTO markAsReady(@PathVariable Long itemId) {
        return kitchenService.markAsReady(itemId);
    }
}