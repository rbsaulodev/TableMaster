package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.CreateOrderRequestDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/orders") // Mantemos o RequestMapping geral para /api/orders
@AllArgsConstructor
@Validated
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CHEF')")
    public ResponseEntity<List<OrderDTO>> listAll() {
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CHEF', 'CUSTOMER')")
    public ResponseEntity<OrderDTO> findById(@PathVariable @NotNull @Positive Long id) {
        OrderDTO order = orderService.findById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/table/{tableId}")
    // Se este endpoint também for para clientes, adicione @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CHEF', 'CUSTOMER')")
    public ResponseEntity<List<OrderDTO>> findByTableId(@PathVariable @NotNull @Positive Long tableId) {
        List<OrderDTO> orders = orderService.findByTableId(tableId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}")
    // Adicione @PreAuthorize conforme necessário para este endpoint (ex: hasAnyRole('ADMIN', 'WAITER'))
    public ResponseEntity<OrderDTO> update(
            @PathVariable @NotNull @Positive Long id,
            @RequestBody @Valid OrderDTO orderDTO) {
        OrderDTO updatedOrder = orderService.update(id, orderDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    @DeleteMapping("/{id}")
    // Adicione @PreAuthorize conforme necessário (ex: hasRole('ADMIN'))
    public ResponseEntity<Void> delete(@PathVariable @NotNull @Positive Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    // Adicione @PreAuthorize conforme necessário (ex: hasAnyRole('ADMIN', 'WAITER'))
    public ResponseEntity<OrderDTO> closeOrder(@PathVariable @NotNull @Positive Long id) {
        OrderDTO closedOrder = orderService.closeOrder(id);
        return ResponseEntity.ok(closedOrder);
    }

    @PatchMapping("/{id}/pay")
    // Adicione @PreAuthorize conforme necessário (ex: hasAnyRole('ADMIN', 'WAITER', 'CUSTOMER'))
    public ResponseEntity<OrderDTO> payOrder(
            @PathVariable @NotNull @Positive Long id,
            @RequestParam PaymentMethod paymentMethod) {
        OrderDTO paidOrder = orderService.updateOrderStatusToPaid(id, paymentMethod.name());
        return ResponseEntity.ok(paidOrder);
    }

    @PostMapping("/create-draft")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')") // Permite apenas CUSTOMER criar rascunhos de pedidos
    public ResponseEntity<OrderDTO> createDraftOrder(@RequestBody @Valid CreateOrderRequestDTO request) {
        OrderDTO createdOrder = orderService.createOrder(request.tableId(), request.userCpf());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PatchMapping("/{orderId}/confirm")
    @PreAuthorize("hasRole('CUSTOMER')") // Permite apenas CUSTOMER confirmar pedidos
    public ResponseEntity<OrderDTO> confirmOrder(@PathVariable Long orderId) {
        OrderDTO confirmedOrder = orderService.confirmOrder(orderId);
        return ResponseEntity.ok(confirmedOrder);
    }

    @GetMapping("/current-draft")
    @PreAuthorize("hasRole('CUSTOMER')") // <-- ADIÇÃO PRINCIPAL AQUI
    public ResponseEntity<OrderDTO> getCurrentDraftOrder(@RequestParam String cpf) {
        return orderService.getCurrentDraftOrderByUser(cpf)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}