package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.repository.OrderItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final MenuItemService menuItemService;
    private final OrderItemRepository orderItemRepository;

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
        return orderMapper.toDTO(orderRepository.save(order));
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
        return orderMapper.toDTO(orderRepository.save(order));
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
        return orderMapper.toDTO(orderRepository.save(order));
    }

    @Transactional
    public void delete(Long id) {
        orderRepository.delete(orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class)));
    }

    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusIn(List.of(OrderStatus.OPEN, OrderStatus.UNPAID))
                .stream()
                .map(orderMapper::toDTO)
                .toList();
    }
}