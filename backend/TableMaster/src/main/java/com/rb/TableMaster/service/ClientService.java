package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final RestaurantTableService tableService;
    private final WebSocketController webSocketController;
    private final OrderRepository orderRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderDTO reserveTable(String clientCpf, Long tableId, String reservedTime) {
        User client = userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        tableService.reserveTable(tableId, clientCpf, reservedTime);
        OrderDTO newOrder = orderService.createOrderForTable(tableId, clientCpf, reservedTime);
        return newOrder;
    }

    @Transactional
    public OrderDTO startDining(String clientCpf, Long tableId) {
        User client = userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));
        tableService.occupyTable(tableId, clientCpf);
        OrderDTO newOrder = orderService.createOrder(tableId, clientCpf);
        return newOrder;
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

    @Transactional
    public OrderDTO confirmOrder(String clientCpf, Long orderId) {
        OrderDTO orderDTO = orderService.findById(orderId);
        if (!orderDTO.userCpf().equals(clientCpf)) {
            throw new IllegalStateException("O pedido " + orderId + " não pertence a este cliente.");
        }
        return orderService.confirmAndOpenOrder(orderId);
    }

    @Transactional
    public OrderDTO requestAccount(String clientCpf, Long orderId, PaymentMethod requestedPaymentMethod) {
        User client = userRepository.findById(clientCpf)
                .orElseThrow(() -> new RecordNotFoundException(clientCpf, User.class));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (!order.getUser().getCpf().equals(clientCpf)) {
            throw new IllegalStateException("O pedido " + orderId + " não pertence ao cliente " + clientCpf);
        }

        OrderDTO updatedOrderDTO = orderService.requestPayment(orderId, requestedPaymentMethod);
        notificationService.publishAccountRequest(order.getTable().getId(), order.getId(), requestedPaymentMethod);

        return updatedOrderDTO;
    }
}