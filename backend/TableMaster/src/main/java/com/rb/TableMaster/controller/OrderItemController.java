package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.CreateOrderItemRequest;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.service.OrderItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-items")
@Validated
// @AllArgsConstructor // Removido para usar construtor explícito abaixo
public class OrderItemController {

    private final OrderItemService orderItemService;

    // Construtor explícito para OrderItemController
    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WAITER', 'ADMIN')")
    public ResponseEntity<OrderItemDTO> addOrderItem(@RequestParam @NotNull @Positive Long orderId, @RequestBody @Valid CreateOrderItemRequest request) {
        OrderItemDTO newOrderItem = orderItemService.addOrderItem(orderId, request.menuItemId(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(newOrderItem);
    }

    // NOVO: Endpoint PATCH para atualizar a quantidade de um item de pedido
    @PatchMapping("/{id}/quantity")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WAITER', 'ADMIN')") // Cliente pode ajustar quantidade
    public ResponseEntity<OrderItemDTO> updateQuantity(
            @PathVariable @NotNull @Positive Long id,
            @RequestParam @NotNull @Positive int quantity) { // 'quantity' agora é um int e Positive
        // O OrderItemService precisa de um método updateQuantity que receba o ID do item e a nova quantidade.
        // A validação de quem pode alterar (se é do pedido do usuário, etc.) deve estar no service.
        OrderItemDTO updatedItem = orderItemService.updateQuantity(id, quantity);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WAITER', 'ADMIN')")
    public ResponseEntity<Void> removeOrderItem(@PathVariable @NotNull @Positive Long id) {
        orderItemService.removeOrderItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WAITER', 'ADMIN', 'CHEF')")
    public ResponseEntity<OrderItemDTO> getOrderItemById(@PathVariable @NotNull @Positive Long id) {
        OrderItemDTO orderItem = orderItemService.getOrderItemById(id);
        return ResponseEntity.ok(orderItem);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('CHEF', 'WAITER', 'ADMIN')")
    public ResponseEntity<List<OrderItemDTO>> getItemsByStatus(@PathVariable String status) {
        OrderItemStatus orderItemStatus = OrderItemStatus.valueOf(status.toUpperCase()); // Convertendo string para enum
        List<OrderItemDTO> items = orderItemService.getItemsByStatus(orderItemStatus);
        return ResponseEntity.ok(items);
    }

    // Endpoint para mudar o status de um item de pedido (usado por Chef/Waiter/Admin)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CHEF', 'WAITER', 'ADMIN')")
    public ResponseEntity<OrderItemDTO> updateItemStatus(
            @PathVariable @NotNull @Positive Long id,
            @RequestParam @NotNull String newStatus) {
        OrderItemStatus status = OrderItemStatus.valueOf(newStatus.toUpperCase());
        OrderItemDTO updatedItem = orderItemService.updateItemStatus(id, status);
        return ResponseEntity.ok(updatedItem);
    }
}