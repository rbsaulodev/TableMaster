package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.*;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderMapper orderMapper;
    private final OrderItemRepository orderItemRepository;

    public List<OrderDTO> findByStatusIn(List<OrderStatus> statuses) {
        return orderRepository.findByStatusIn(statuses).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public OrderDTO getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .map(orderMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));
    }

    public List<OrderDTO> findByTableId(Long tableId) {
        return orderRepository.findByTableId(tableId).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public OrderDTO createOrderForTable(Long tableId, String userCpf) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        // Verifica se já existe um pedido em aberto para esta mesa
        if (orderRepository.existsByTableAndStatusIn(table,
                List.of(OrderStatus.OPEN, OrderStatus.UNPAID))) {
            throw new IllegalStateException("Já existe um pedido em aberto para esta mesa");
        }

        Order order = new Order();
        order.setTable(table);
        order.setUser(user);
        order.setStatus(OrderStatus.OPEN);
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalValue(BigDecimal.ZERO);

        Order savedOrder = orderRepository.save(order);

        // Atualiza o status da mesa para ocupada
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        return orderMapper.toDTO(savedOrder);
    }

    public OrderDTO addItemsToOrder(Long orderId, List<OrderItemDTO> items) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Não é possível adicionar itens a um pedido fechado");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                items.stream().map(OrderItemDTO::menuItemId).toList());

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
                .toList();

        orderItemRepository.saveAll(newItems);
        order.getItems().addAll(newItems);
        order.setTotalValue(calculateTotalValue(order));

        Order updatedOrder = orderRepository.save(order);
        return orderMapper.toDTO(updatedOrder);
    }

    public OrderDTO closeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Apenas pedidos em aberto podem ser fechados");
        }

        order.setStatus(OrderStatus.UNPAID);
        Order updatedOrder = orderRepository.save(order);
        return orderMapper.toDTO(updatedOrder);
    }

    public OrderDTO payOrder(Long orderId, PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.UNPAID) {
            throw new IllegalStateException("Apenas pedidos não pagos podem ser pagos");
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        order.setClosedAt(LocalDateTime.now());

        // Libera a mesa
        RestaurantTable table = order.getTable();
        table.setStatus(TableStatus.AVAILABLE);
        tableRepository.save(table);

        Order paidOrder = orderRepository.save(order);
        return orderMapper.toDTO(paidOrder);
    }

    public List<OrderDTO> getOrdersByUser(String userCpf) {
        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        return orderRepository.findByUser(user).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusIn(List.of(OrderStatus.OPEN, OrderStatus.UNPAID)).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    private BigDecimal calculateTotalValue(Order order) {
        return order.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

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

    @Transactional
    public OrderDTO create(OrderDTO orderDTO) {
        Order order = orderMapper.toEntity(orderDTO);

        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        User user = userRepository.findById(String.valueOf(orderDTO.userCpf()))
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));

        order.setTable(table);
        order.setUser(user);
        order.setStatus(OrderStatus.OPEN);
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalValue(BigDecimal.ZERO);

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toDTO(savedOrder);
    }

    @Transactional
    public OrderDTO update(Long id, OrderDTO orderDTO) {
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        orderMapper.updateEntityFromDTO(orderDTO, existingOrder);

        if (orderDTO.tableId() != null) {
            RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                    .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));
            existingOrder.setTable(table);
        }

        if (orderDTO.userCpf() != null) {
            User user = userRepository.findById(String.valueOf(orderDTO.userCpf()))
                    .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));
            existingOrder.setUser(user);
        }

        Order updatedOrder = orderRepository.save(existingOrder);
        return orderMapper.toDTO(updatedOrder);
    }

    @Transactional
    public void delete(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Only open orders can be deleted");
        }

        orderRepository.delete(order);
    }
}