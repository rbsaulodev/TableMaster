package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.UserMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final RestaurantTableService tableService;
    private final MenuItemService menuItemService;
    private final UserMapper userMapper;

    public OrderDTO reserveTable(String clientCpf, Long tableId) {
        userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        tableService.reserveTable(tableId, clientCpf);

        return orderService.getActiveOrders().stream()
                .filter(order -> order.tableId().equals(tableId)
                        && (order.status() == OrderStatus.OPEN || order.status() == OrderStatus.UNPAID))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pedido não foi criado automaticamente"));
    }

    public OrderDTO startDining(String clientCpf, Long tableId) {
        userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        tableService.occupyTable(tableId, clientCpf);

        return orderService.getActiveOrders().stream()
                .filter(order -> order.tableId().equals(tableId)
                        && (order.status() == OrderStatus.OPEN || order.status() == OrderStatus.UNPAID))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pedido não foi criado automaticamente"));
    }

    public OrderDTO addItemsToOrder(String clientCpf, Long orderId, List<OrderItemDTO> items) {
        OrderDTO order = orderService.getOrderById(orderId);
        if (!order.userCpf().equals(clientCpf)) {
            throw new IllegalStateException("O pedido não pertence a este cliente");
        }

        return orderService.addItemsToOrder(orderId, items);
    }

    public OrderDTO closeOrder(String clientCpf, Long orderId) {
        OrderDTO order = orderService.getOrderById(orderId);
        if (!order.userCpf().equals(clientCpf)) {
            throw new IllegalStateException("O pedido não pertence a este cliente");
        }
        return orderService.closeOrder(orderId);
    }

    public List<OrderDTO> getClientOrders(String clientCpf) {
        userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        return orderService.getOrdersByUser(clientCpf);
    }
}