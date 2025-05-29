package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<OrderDTO>> listAll() {
        List<OrderDTO> orders = orderService.list();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> findById(@PathVariable @NotNull @Positive Long id) {
        OrderDTO order = orderService.findById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<OrderDTO>> findByTableId(@PathVariable @NotNull @Positive Long tableId) {
        List<OrderDTO> orders = orderService.findByTableId(tableId);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<OrderDTO> create(@RequestBody @Valid OrderDTO orderDTO) {
        OrderDTO createdOrder = orderService.create(orderDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> update(
            @PathVariable @NotNull @Positive Long id,
            @RequestBody @Valid OrderDTO orderDTO) {
        OrderDTO updatedOrder = orderService.update(id, orderDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NotNull @Positive Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<OrderDTO> closeOrder(@PathVariable @NotNull @Positive Long id) {
        OrderDTO closedOrder = orderService.closeOrder(id);
        return ResponseEntity.ok(closedOrder);
    }

    @PatchMapping("/{id}/pay")
    public ResponseEntity<OrderDTO> payOrder(
            @PathVariable @NotNull @Positive Long id,
            @RequestParam PaymentMethod paymentMethod) {
        OrderDTO paidOrder = orderService.payOrder(id, paymentMethod);
        return ResponseEntity.ok(paidOrder);
    }
}