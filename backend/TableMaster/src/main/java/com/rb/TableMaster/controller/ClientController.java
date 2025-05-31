package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.ReserveTableRequestDTO;
import com.rb.TableMaster.service.ClientService;
import com.rb.TableMaster.service.OrderService;
import com.rb.TableMaster.service.RestaurantTableService;
import com.rb.TableMaster.service.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final ClientService clientService;

    @GetMapping("/tables/available")
    public List<RestaurantTableDTO> getAvailableTables() {
        return tableService.getAvailableTables();
    }

    @PostMapping("/reserve")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO reserveTable(@RequestBody @Valid ReserveTableRequestDTO request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String clientCpf = userDetails.getUser().getCpf();
        return clientService.reserveTable(clientCpf, request.getTableId(), request.getReservedTime());
    }

    @PostMapping("/order/{orderId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO addItemsToOrder(@PathVariable Long orderId, @RequestBody List<OrderItemDTO> items, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String clientCpf = userDetails.getUser().getCpf();
        return clientService.addItemsToOrder(clientCpf, orderId, items);
    }

    @GetMapping("/orders")
    public List<OrderDTO> getMyOrders(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String clientCpf = userDetails.getUser().getCpf();
        return clientService.getClientOrders(clientCpf);
    }

    @PatchMapping("/order/{orderId}/request-bill")
    public OrderDTO requestBill(@PathVariable Long orderId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String clientCpf = userDetails.getUser().getCpf();
        return clientService.closeOrder(clientCpf, orderId);
    }
}