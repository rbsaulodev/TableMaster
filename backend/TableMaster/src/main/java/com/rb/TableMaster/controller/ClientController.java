package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.service.OrderService;
import com.rb.TableMaster.service.RestaurantTableService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@AllArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class ClientController {

    private final RestaurantTableService tableService;
    private final OrderService orderService;

    @GetMapping("/tables/available")
    public List<RestaurantTableDTO> getAvailableTables() {
        return tableService.getAvailableTables();
    }

    @PostMapping("/reserve/{tableId}")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO reserveTable(@PathVariable Long tableId, Authentication authentication) {
        String cpf = authentication.getName();
        return orderService.createOrderForTable(tableId, cpf);
    }

    @PostMapping("/order/{orderId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO addItemsToOrder(@PathVariable Long orderId, @RequestBody List<OrderItemDTO> items, Authentication authentication) {
        String currentCpf = authentication.getName();
        OrderDTO existingOrder = orderService.findById(orderId);
        if (existingOrder == null || !existingOrder.userCpf().equals(currentCpf)) {
            throw new AccessDeniedException("Você não tem permissão para adicionar itens a este pedido.");
        }
        return orderService.addItemsToOrder(orderId, items);
    }

    @GetMapping("/orders")
    public List<OrderDTO> getMyOrders(Authentication authentication) {
        String cpf = authentication.getName();
        return orderService.getOrdersByUser(cpf);
    }

    @PatchMapping("/order/{orderId}/request-bill")
    public OrderDTO requestBill(@PathVariable Long orderId, Authentication authentication) {
        String currentCpf = authentication.getName();
        OrderDTO existingOrder = orderService.findById(orderId);
        if (existingOrder == null || !existingOrder.userCpf().equals(currentCpf)) {
            throw new AccessDeniedException("Você não tem permissão para solicitar a conta para este pedido.");
        }
        return orderService.closeOrder(orderId);
    }
}