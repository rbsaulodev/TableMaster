package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.service.OrderItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/order-items")
@AllArgsConstructor
public class OrderItemController {

    private final OrderItemService orderItemService;

    @GetMapping
    public List<OrderItemDTO> listAll() {
        return orderItemService.list();
    }

    @GetMapping("/{id}")
    public OrderItemDTO findById(@PathVariable @NotNull @Positive Long id) {
        return orderItemService.findById(id);
    }

    @GetMapping("/order/{orderId}")
    public List<OrderItemDTO> getItemsByOrder(@PathVariable @NotNull @Positive Long orderId) {
        return orderItemService.getItemsByOrder(orderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderItemDTO create(@RequestBody @Valid OrderItemDTO dto,
                               @RequestParam @NotNull @Positive Long orderId) {
        return orderItemService.create(dto, orderId);
    }

    @PutMapping("/{id}")
    public OrderItemDTO update(@PathVariable @NotNull @Positive Long id,
                               @RequestBody @Valid OrderItemDTO dto) {
        return orderItemService.update(dto, id);
    }

    @PatchMapping("/{id}/quantity")
    public OrderItemDTO updateQuantity(@PathVariable @NotNull @Positive Long id,
                                       @RequestParam @Positive int newQuantity) {
        return orderItemService.updateQuantity(id, newQuantity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotNull @Positive Long id) {
        orderItemService.delete(id);
    }
}