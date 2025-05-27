package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.service.MenuItemService;
import com.rb.TableMaster.service.OrderService;
import com.rb.TableMaster.service.RestaurantTableService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class ClientController {

    private final RestaurantTableService tableService;
    private final OrderService orderService;
    private final MenuItemService menuItemService;

    @GetMapping("/tables/available")
    public List<RestaurantTableDTO> getAvailableTables() {
        return tableService.listAvailableTables();
    }

    @PostMapping("/reserve-table")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO reserveTable(@RequestParam String cpf, @RequestParam Long tableId) {
        return orderService.createComandaWithReservation(cpf, tableId);
    }

    @GetMapping("/menu")
    public List<MenuItemDTO> getMenu() {
        return menuItemService.list();
    }

    @PostMapping("/comanda/{comandaId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO addItemsToComanda(@PathVariable Long comandaId, @RequestBody List<OrderItemDTO> items) {
        return orderService.addItemsToOrder(comandaId, items);
    }

    @GetMapping("/comanda/user/{cpf}")
    public List<OrderDTO> getMyComandas(@PathVariable String cpf) {
        return orderService.findByUserCpf(cpf);
    }

    @PatchMapping("/comanda/{comandaId}/finalize")
    public OrderDTO requestBill(@PathVariable Long comandaId) {
        return orderService.finalizeOrder(comandaId);
    }
}