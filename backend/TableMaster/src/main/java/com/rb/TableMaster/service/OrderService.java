package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.*;
import com.rb.TableMaster.model.enums.*;
import com.rb.TableMaster.repository.*;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Validated
@Service
@AllArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public List<OrderDTO> list() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO findById(@NotNull @Positive Long id) {
        return orderRepository.findById(id)
                .map(orderMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
    }

    @Transactional
    public OrderDTO create(@Valid @NotNull OrderDTO orderDTO) {
        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        User user = userRepository.findById(String.valueOf(orderDTO.userId()))
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userId(), User.class));

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário com ID " + orderDTO.userId() + " está inativo e não pode criar pedidos");
        }

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("Mesa com ID " + table.getId() + " não está disponível");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                orderDTO.items().stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        Order order = new Order();
        order.setTable(table);
        order.setUser(user);
        order.setStatus(OrderStatus.OPEN);
        order.setCreatedAt(LocalDateTime.now());

        List<OrderItem> orderItems = orderDTO.items().stream()
                .map(itemDTO -> {
                    MenuItem menuItem = menuItems.stream()
                            .filter(mi -> mi.getId().equals(itemDTO.menuItemId()))
                            .findFirst()
                            .orElseThrow(() -> new RecordNotFoundException(itemDTO.menuItemId(), MenuItem.class));

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(order);
                    orderItem.setMenuItem(menuItem);
                    orderItem.setQuantity(itemDTO.quantity());
                    orderItem.setUnitPrice(menuItem.getPrice());
                    orderItem.setStatus(OrderItemStatus.PENDING);
                    return orderItem;
                })
                .collect(Collectors.toList());

        order.setItems(orderItems);
        order.setTotalValue(calculateTotalValue(order));

        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public OrderDTO createComandaWithReservation(@NotNull @NotBlank String cpf, @NotNull @Positive Long tableId) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário com CPF " + cpf + " está inativo");
        }

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("Mesa não está disponível para reserva");
        }

        List<Order> openOrders = orderRepository.findByUserAndStatus(user, OrderStatus.OPEN);
        if (!openOrders.isEmpty()) {
            throw new IllegalStateException("Usuário já possui um pedido em aberto");
        }

        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        Order order = new Order();
        order.setUser(user);
        order.setTable(table);
        order.setStatus(OrderStatus.OPEN);
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalValue(BigDecimal.ZERO);

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public OrderDTO addItemsToOrder(@NotNull @Positive Long orderId, @Valid @NotNull List<OrderItemDTO> items) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Não é possível adicionar itens a um pedido fechado");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                items.stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        List<OrderItem> newItems = items.stream()
                .map(itemDTO -> {
                    MenuItem menuItem = menuItems.stream()
                            .filter(mi -> mi.getId().equals(itemDTO.menuItemId()))
                            .findFirst()
                            .orElseThrow(() -> new RecordNotFoundException(itemDTO.menuItemId(), MenuItem.class));

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(order);
                    orderItem.setMenuItem(menuItem);
                    orderItem.setQuantity(itemDTO.quantity());
                    orderItem.setUnitPrice(menuItem.getPrice());
                    orderItem.setStatus(OrderItemStatus.PENDING);
                    return orderItem;
                })
                .collect(Collectors.toList());

        order.getItems().addAll(newItems);
        order.setTotalValue(calculateTotalValue(order));

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public OrderDTO finalizeOrder(@NotNull @Positive Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Apenas pedidos em aberto podem ser finalizados");
        }

        if (order.getItems().isEmpty()) {
            throw new IllegalStateException("Não é possível finalizar um pedido vazio");
        }

        order.setStatus(OrderStatus.UNPAID);
        order.setTotalValue(calculateTotalValue(order));

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public OrderDTO payOrder(@NotNull @Positive Long orderId, @NotNull PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.UNPAID) {
            throw new IllegalStateException("Apenas pedidos não pagos podem ser pagos");
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        order.setClosedAt(LocalDateTime.now());

        RestaurantTable table = order.getTable();
        table.setStatus(TableStatus.AVAILABLE);
        tableRepository.save(table);

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    public List<OrderDTO> findByUserCpf(@NotNull @NotBlank String cpf) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        return orderRepository.findByUser(user).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> findOpenOrders() {
        return orderRepository.findByStatus(OrderStatus.OPEN).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> findUnpaidOrders() {
        return orderRepository.findByStatus(OrderStatus.UNPAID).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> findByTableId(@NotNull @Positive Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        return orderRepository.findByTable(table).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO updateStatus(@NotNull @Positive Long orderId, @NotNull OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == OrderStatus.PAID) {
            throw new IllegalStateException("Pedidos pagos não podem ser modificados");
        }

        if (newStatus == OrderStatus.PAID && currentStatus != OrderStatus.UNPAID) {
            throw new IllegalStateException("Apenas pedidos não pagos podem ser pagos");
        }

        if (newStatus == OrderStatus.UNPAID && currentStatus != OrderStatus.OPEN) {
            throw new IllegalStateException("Apenas pedidos em aberto podem ser finalizados");
        }

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.PAID) {
            order.setClosedAt(LocalDateTime.now());
            order.getTable().setStatus(TableStatus.AVAILABLE);
            tableRepository.save(order.getTable());
        }

        Order saved = orderRepository.save(order);
        return orderMapper.toDTO(saved);
    }

    public List<OrderDTO> findByStatus(@NotNull OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO update(@NotNull @Positive Long id, @Valid @NotNull OrderDTO orderDTO) {
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        User user = userRepository.findById(String.valueOf(orderDTO.userId()))
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userId(), User.class));

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário está inativo e não pode atualizar pedidos");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                orderDTO.items().stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        existingOrder.setTable(table);
        existingOrder.setUser(user);
        existingOrder.setStatus(orderDTO.status());

        existingOrder.getItems().clear();
        List<OrderItem> updatedItems = orderDTO.items().stream()
                .map(itemDTO -> {
                    MenuItem menuItem = menuItems.stream()
                            .filter(mi -> mi.getId().equals(itemDTO.menuItemId()))
                            .findFirst()
                            .orElseThrow(() -> new RecordNotFoundException(itemDTO.menuItemId(), MenuItem.class));

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(existingOrder);
                    orderItem.setMenuItem(menuItem);
                    orderItem.setQuantity(itemDTO.quantity());
                    orderItem.setUnitPrice(menuItem.getPrice());
                    orderItem.setStatus(OrderItemStatus.PENDING);
                    return orderItem;
                })
                .collect(Collectors.toList());

        existingOrder.getItems().addAll(updatedItems);
        existingOrder.setTotalValue(calculateTotalValue(existingOrder));

        Order saved = orderRepository.save(existingOrder);
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public void delete(@NotNull @Positive Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        if (order.getStatus() == OrderStatus.OPEN) {
            order.getTable().setStatus(TableStatus.AVAILABLE);
            tableRepository.save(order.getTable());
        }

        orderRepository.delete(order);
    }

    private BigDecimal calculateTotalValue(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }

        return order.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}