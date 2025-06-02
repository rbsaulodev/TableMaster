package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final RestaurantTableService tableService;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    public OrderDTO reserveTable(String clientCpf, Long tableId, String reservedTime) {
        userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        tableService.reserveTable(tableId, clientCpf, reservedTime);

        return orderService.getActiveOrders().stream()
                .filter(order -> order.tableId().equals(tableId)
                        && (order.status() == OrderStatus.OPEN))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pedido não foi criado automaticamente após reserva."));
    }

    public OrderDTO startDining(String clientCpf, Long tableId) {
        userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));
        tableService.occupyTable(tableId, clientCpf);
        return orderService.getActiveOrders().stream()
                .filter(order -> order.tableId().equals(tableId)
                        && (order.status() == OrderStatus.OPEN || order.status() == OrderStatus.UNPAID))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pedido não foi criado automaticamente."));
    }

    public OrderDTO addItemsToOrder(String clientCpf, Long orderId, List<OrderItemDTO> items) {
        OrderDTO order = orderService.findById(orderId);
        if (!order.userCpf().equals(clientCpf)) {
            throw new IllegalStateException("O pedido não pertence a este cliente");
        }
        return orderService.addItemsToOrder(orderId, items);
    }

    public OrderDTO closeOrder(String clientCpf, Long orderId) {
        OrderDTO order = orderService.findById(orderId);
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