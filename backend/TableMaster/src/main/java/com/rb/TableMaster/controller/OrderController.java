package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.CreateOrderRequestDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.model.enums.OrderStatus;
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
@RequestMapping("api/orders")
@AllArgsConstructor
@Validated
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CHEF')")
    public ResponseEntity<List<OrderDTO>> list(@RequestParam(name = "status", required = false) OrderStatus status) {
        List<OrderDTO> orders;
        if (status != null) {
            orders = orderService.findByStatus(status);
        } else {
            orders = orderService.getAllOrders();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER')")
    public ResponseEntity<List<OrderDTO>> getAllPaidOrders() {
        List<OrderDTO> paidOrders = orderService.findByStatus(OrderStatus.PAID);
        return ResponseEntity.ok(paidOrders);
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CHEF', 'CUSTOMER')")
    public ResponseEntity<OrderDTO> findById(@PathVariable @NotNull @Positive Long id) {
        OrderDTO order = orderService.findById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/table/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER', 'CUSTOMER')")
    public ResponseEntity<List<OrderDTO>> findByTableId(@PathVariable @NotNull @Positive Long tableId) {
        List<OrderDTO> orders = orderService.findByTableId(tableId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER')")
    public ResponseEntity<OrderDTO> update(
            @PathVariable @NotNull @Positive Long id,
            @RequestBody @Valid OrderDTO orderDTO) {
        OrderDTO updatedOrder = orderService.update(id, orderDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @NotNull @Positive Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER')")
    public ResponseEntity<OrderDTO> closeOrder(@PathVariable @NotNull @Positive Long id) {
        OrderDTO closedOrder = orderService.closeOrder(id);
        return ResponseEntity.ok(closedOrder);
    }

    @PatchMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER')")
    public ResponseEntity<OrderDTO> payOrder(
            @PathVariable @NotNull @Positive Long id,
            @RequestParam PaymentMethod paymentMethod) {
        OrderDTO paidOrder = orderService.payOrder(id, paymentMethod);
        return ResponseEntity.ok(paidOrder);
    }

    @PostMapping("/create-draft")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDTO> createDraftOrder(@RequestBody @Valid CreateOrderRequestDTO request) {
        OrderDTO createdOrder = orderService.createOrder(request.tableId(), request.userCpf());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PostMapping("/create-for-table")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'WAITER')")
    public ResponseEntity<OrderDTO> createOrderForTable(@RequestBody @Valid CreateOrderRequestDTO request) {
        OrderDTO createdOrder = orderService.createOrder(request.tableId(), request.userCpf());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PatchMapping("/{orderId}/confirm")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDTO> confirmOrder(@PathVariable Long orderId) {
        OrderDTO confirmedOrder = orderService.confirmOrder(orderId);
        return ResponseEntity.ok(confirmedOrder);
    }
}