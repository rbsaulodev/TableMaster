package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.service.OrderItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/order-items")
public class OrderItemController {

    private final OrderItemService orderItemService;

    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
    }

    @GetMapping
    public List<OrderItemDTO> listAll() {
        return orderItemService.list();
    }

    @GetMapping("/{id}")
    public OrderItemDTO findById(@PathVariable @NotNull @Positive Long id) {
        return orderItemService.findById(id);
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotNull @Positive Long id) {
        orderItemService.delete(id);
    }
}
