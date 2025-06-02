package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
import com.rb.TableMaster.event.OrderEventPublisher;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.OrderItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final MenuItemService menuItemService;
    private final OrderItemRepository orderItemRepository;
    private final OrderEventPublisher eventPublisher;
    private final WebSocketController webSocketController;
    private final RestaurantTableMapper restaurantTableMapper;

    @Lazy
    private final NotificationService notificationService;

    public List<OrderDTO> list() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public OrderDTO findById(Long id) {
        return orderRepository.findById(id)
                .map(orderMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
    }

    public List<OrderDTO> findByTableId(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));
        return orderRepository.findByTable(table).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public List<OrderDTO> getOrdersByUser(String userCpf) {
        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));
        return orderRepository.findByUser(user).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    @Transactional
    public OrderDTO createOrderForTable(Long tableId, String userCpf, String reservedTime) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));
        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        Order order = Order.builder()
                .table(table)
                .user(user)
                .createdAt(LocalDateTime.now())
                .status(OrderStatus.OPEN)
                .totalValue(BigDecimal.ZERO)
                .reservedTime(reservedTime)
                .build();

        return orderMapper.toDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderDTO create(OrderDTO orderDTO) {
        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));
        User user = userRepository.findById(orderDTO.userCpf())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));

        Order order = Order.builder()
                .table(table)
                .user(user)
                .createdAt(orderDTO.createdAt() != null ? orderDTO.createdAt() : LocalDateTime.now())
                .status(orderDTO.status() != null ? orderDTO.status() : OrderStatus.OPEN)
                .totalValue(orderDTO.totalValue() != null ? orderDTO.totalValue() : BigDecimal.ZERO)
                .paymentMethod(orderDTO.paymentMethod())
                .closedAt(orderDTO.closedAt())
                .reservedTime(orderDTO.reservedTime())
                .build();
        return orderMapper.toDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderDTO update(Long id, OrderDTO orderDTO) {
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        orderMapper.updateEntityFromDTO(orderDTO, existingOrder);
        return orderMapper.toDTO(orderRepository.save(existingOrder));
    }

    @Transactional
    public OrderDTO addItemsToOrder(Long orderId, List<OrderItemDTO> itemDTOs) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getItems() == null) {
            order.setItems(new java.util.ArrayList<>());
        }

        BigDecimal currentTotal = order.getTotalValue() != null ? order.getTotalValue() : BigDecimal.ZERO;

        for (OrderItemDTO itemDTO : itemDTOs) {
            OrderItem existingItem = order.getItems().stream()
                    .filter(oi -> oi.getMenuItem().getId().equals(itemDTO.menuItemId()))
                    .findFirst()
                    .orElse(null);

            if (existingItem != null) {
                BigDecimal oldItemTotalPrice = existingItem.getUnitPrice().multiply(BigDecimal.valueOf(existingItem.getQuantity()));
                currentTotal = currentTotal.subtract(oldItemTotalPrice);

                existingItem.setQuantity(existingItem.getQuantity() + itemDTO.quantity());
                existingItem.setTotalPrice(existingItem.getUnitPrice().multiply(BigDecimal.valueOf(existingItem.getQuantity())));
                currentTotal = currentTotal.add(existingItem.getTotalPrice());

                orderItemRepository.save(existingItem);
            } else {
                com.rb.TableMaster.model.MenuItem menuItem = menuItemService.findEntityById(itemDTO.menuItemId());

                OrderItem newItem = OrderItem.builder()
                        .order(order)
                        .menuItem(menuItem)
                        .quantity(itemDTO.quantity())
                        .unitPrice(menuItem.getPrice())
                        .totalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemDTO.quantity())))
                        .status(com.rb.TableMaster.model.enums.OrderItemStatus.PENDING)
                        .build();
                orderItemRepository.save(newItem);
                order.getItems().add(newItem);
                currentTotal = currentTotal.add(newItem.getTotalPrice());
            }
        }
        order.setTotalValue(currentTotal);
        OrderDTO updatedOrderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(updatedOrderDTO);
        return updatedOrderDTO;
    }

    @Transactional
    public OrderDTO closeOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("O pedido já está pago.");
        }

        order.setStatus(OrderStatus.UNPAID);
        order.setClosedAt(LocalDateTime.now());
        OrderDTO orderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    @Transactional
    public OrderDTO payOrder(Long id, PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        if (order.getStatus() != OrderStatus.UNPAID) {
            throw new IllegalStateException("O pedido não está pronto para pagamento (Status: " + order.getStatus() + ")");
        }

        order.setPaymentMethod(paymentMethod);
        order.setStatus(OrderStatus.PAID);
        order.setClosedAt(LocalDateTime.now());
        OrderDTO orderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    @Transactional
    public void delete(Long id) {
        Order orderToDelete = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        orderRepository.delete(orderToDelete);

        webSocketController.sendOrderDeleted(id);
    }

    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusIn(List.of(OrderStatus.OPEN, OrderStatus.UNPAID))
                .stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    // --- MÉTODOS ADICIONADOS / RESTAURADOS ABAIXO ---

    // Este método é essencial para o OrderItemService recalcular o total do pedido
    // e para outros serviços que precisam do DTO completo de um pedido por ID.
    public OrderDTO getOrderDTOById(Long id) { // Renomeado de findById para evitar conflito com o método acima que retorna OrderDTO
        return orderRepository.findById(id)
                .map(orderMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
    }

    // Este método é essencial para o OrderItemService recalcular o total do pedido
    @Transactional
    public void recalculateOrderTotal(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        // Carrega os OrderItems associados a este pedido
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

        BigDecimal total = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalValue(total);
        Order savedOrder = orderRepository.save(order);

        System.out.println("DEBUG WS Backend: Enviando OrderUpdate (recalculateTotal) para: " + savedOrder.getId() + " - Novo Total: " + savedOrder.getTotalValue());
        webSocketController.sendOrderUpdate(orderMapper.toDTO(savedOrder));
    }
    // --- FIM DOS MÉTODOS ADICIONADOS / RESTAURADOS ---

    @Transactional
    public OrderDTO createOrder(Long tableId, String userCpf) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));
        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        Order order = Order.builder()
                .table(table)
                .user(user)
                .createdAt(LocalDateTime.now())
                .status(OrderStatus.DRAFT)
                .totalValue(java.math.BigDecimal.ZERO)
                .items(Collections.emptyList())
                .build();
        order = orderRepository.save(order);

        OrderDTO orderDTO = orderMapper.toDTO(order);
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    @Transactional
    public OrderDTO confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new IllegalStateException("Order is not in DRAFT status and cannot be confirmed.");
        }
        if (order.getItems().isEmpty()) {
            throw new IllegalStateException("Order has no items and cannot be confirmed.");
        }

        order.setStatus(OrderStatus.OPEN);
        order.getTable().setStatus(TableStatus.OCCUPIED);
        tableRepository.save(order.getTable());

        OrderDTO orderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(orderDTO);
        webSocketController.sendTableUpdate(restaurantTableMapper.toDTO(order.getTable()));
        return orderDTO;
    }

    public List<OrderDTO> getActiveOrdersForWaiter() {
        List<OrderStatus> activeStatuses = List.of(OrderStatus.OPEN, OrderStatus.UNPAID);
        return orderRepository.findByStatusIn(activeStatuses).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO updateOrderStatusToPaid(Long orderId, String paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Order is already paid.");
        }

        order.setPaymentMethod(com.rb.TableMaster.model.enums.PaymentMethod.valueOf(paymentMethod));
        order.setStatus(OrderStatus.PAID);
        order.setClosedAt(LocalDateTime.now());
        OrderDTO orderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    @Transactional
    public OrderDTO updateOrderStatusToUnpaid(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));
        if (order.getStatus() == OrderStatus.UNPAID) {
            throw new IllegalStateException("Order is already marked as unpaid.");
        }
        order.setStatus(OrderStatus.UNPAID);
        orderRepository.save(order);

        if (eventPublisher != null) {
            eventPublisher.publishAccountRequest(order.getTable().getId(), order.getId());
        }
        OrderDTO orderDTO = orderMapper.toDTO(orderRepository.save(order));
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    public Optional<OrderDTO> getCurrentDraftOrderByUser(String userCpf) {
        return orderRepository.findByUserCpfAndStatus(userCpf, OrderStatus.DRAFT)
                .map(orderMapper::toDTO);
    }
}