package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final MenuItemService menuItemService;
    private final OrderItemRepository orderItemRepository;
    private final WebSocketController webSocketController;
    private final RestaurantTableMapper restaurantTableMapper;
    private final OrderItemService orderItemService;
    @Lazy
    private final RestaurantTableService restaurantTableService;

    @Lazy
    private final NotificationService notificationService;

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public OrderService(OrderRepository orderRepository,
                        OrderMapper orderMapper,
                        RestaurantTableRepository tableRepository,
                        UserRepository userRepository,
                        MenuItemService menuItemService,
                        OrderItemRepository orderItemRepository,
                        WebSocketController webSocketController,
                        RestaurantTableMapper restaurantTableMapper, OrderItemService orderItemService,
                        @Lazy RestaurantTableService restaurantTableService,
                        @Lazy NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderMapper = orderMapper;
        this.tableRepository = tableRepository;
        this.userRepository = userRepository;
        this.menuItemService = menuItemService;
        this.orderItemRepository = orderItemRepository;
        this.webSocketController = webSocketController;
        this.restaurantTableMapper = restaurantTableMapper;
        this.orderItemService = orderItemService;
        this.restaurantTableService = restaurantTableService;
        this.notificationService = notificationService;
    }
    public List<OrderDTO> list() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public OrderDTO findById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        order.getItems().size();
        return orderMapper.toDTO(order);
    }

    public List<OrderDTO> findByTableId(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));
        return orderRepository.findByTable(table).stream()
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                })
                .toList();
    }

    public List<OrderDTO> getOrdersByUser(String userCpf) {
        User user = userRepository.findById(userCpf)
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));
        return orderRepository.findByUser(user).stream()
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                })
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
                .items(new ArrayList<>())
                .build();

        Order savedOrder = orderRepository.save(order);
        OrderDTO orderDTO = orderMapper.toDTO(savedOrder);

        webSocketController.sendOrderUpdate(orderDTO);
        notificationService.publishNewOrder(table.getId(), savedOrder.getId());
        return orderDTO;
    }

    @Transactional
    public OrderDTO create(OrderDTO orderDTO) {
        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));
        User user = userRepository.findById(orderDTO.userCpf())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));

        Order order = orderMapper.toEntity(orderDTO);
        order.setTable(table);
        order.setUser(user);
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus(orderDTO.status() != null ? orderDTO.status() : OrderStatus.OPEN);
        order.setTotalValue(orderDTO.totalValue() != null ? orderDTO.totalValue() : BigDecimal.ZERO);
        order.setItems(new ArrayList<>());
        Order savedOrder = orderRepository.save(order);
        OrderDTO resultDTO = orderMapper.toDTO(savedOrder);
        webSocketController.sendOrderUpdate(resultDTO);
        return resultDTO;
    }

    @Transactional
    public OrderDTO update(Long id, OrderDTO orderDTO) {
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        orderMapper.updateEntityFromDTO(orderDTO, existingOrder);
        Order savedOrder = orderRepository.save(existingOrder);
        OrderDTO resultDTO = orderMapper.toDTO(savedOrder);
        webSocketController.sendOrderUpdate(resultDTO);
        return resultDTO;
    }

    @Transactional
    public OrderDTO addItemsToOrder(Long orderId, List<OrderItemDTO> itemDTOs) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));
        order.getItems().size();

        BigDecimal currentTotal = order.getTotalValue() != null ? order.getTotalValue() : BigDecimal.ZERO;

        for (OrderItemDTO itemDTO : itemDTOs) {
            OrderItem existingItem = order.getItems().stream()
                    .filter(oi -> oi.getMenuItem() != null && oi.getMenuItem().getId().equals(itemDTO.menuItemId()))
                    .findFirst()
                    .orElse(null);

            if (existingItem != null) {
                BigDecimal oldItemTotalPrice = existingItem.getUnitPrice().multiply(BigDecimal.valueOf(existingItem.getQuantity()));
                currentTotal = currentTotal.subtract(oldItemTotalPrice);

                existingItem.setQuantity(existingItem.getQuantity() + itemDTO.quantity());
                existingItem.setTotalPrice(existingItem.getUnitPrice().multiply(BigDecimal.valueOf(existingItem.getQuantity())));
                existingItem.setUpdatedAt(LocalDateTime.now());
                orderItemRepository.save(existingItem);
                currentTotal = currentTotal.add(existingItem.getTotalPrice());
            } else {
                com.rb.TableMaster.model.MenuItem menuItem = menuItemService.findEntityById(itemDTO.menuItemId());

                OrderItem newItem = OrderItem.builder()
                        .order(order)
                        .menuItem(menuItem)
                        .quantity(itemDTO.quantity())
                        .unitPrice(menuItem.getPrice())
                        .totalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemDTO.quantity())))
                        .status(com.rb.TableMaster.model.enums.OrderItemStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                orderItemRepository.save(newItem);
                order.getItems().add(newItem);
                currentTotal = currentTotal.add(newItem.getTotalPrice());
                notificationService.publishNewOrderItem(newItem.getId());
            }
        }
        order.setTotalValue(currentTotal);
        Order savedOrder = orderRepository.save(order);
        OrderDTO updatedOrderDTO = orderMapper.toDTO(savedOrder);
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
    public OrderDTO payOrder(Long orderId, PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Order is already paid.");
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        order.setClosedAt(LocalDateTime.now());
        Order paidOrder = orderRepository.save(order);

        RestaurantTable table = paidOrder.getTable();
        if (table != null) {
            List<Order> otherActiveOrdersOnTable = orderRepository
                    .findByTableAndStatusInAndIdNot(
                            table,
                            List.of(OrderStatus.OPEN, OrderStatus.UNPAID),
                            paidOrder.getId()
                    );

            if (otherActiveOrdersOnTable.isEmpty()) {
                log.info("Nenhum outro pedido ativo para a mesa {}, liberando a mesa.", table.getId());
                restaurantTableService.releaseTable(table.getId());
            } else {
                log.info("Ainda existem {} outros pedidos ativos/pendentes para a mesa {}. A mesa não será liberada automaticamente.", otherActiveOrdersOnTable.size(), table.getId());
            }
        } else {
            log.warn("Pedido {} pago não está associado a nenhuma mesa. Não foi possível tentar liberar.", paidOrder.getId());
        }

        if (paidOrder.getItems() != null) {
            paidOrder.getItems().forEach(item -> {
                if (item.getStatus() != com.rb.TableMaster.model.enums.OrderItemStatus.DELIVERED) {
                    orderItemService.updateItemStatus(item.getId(), com.rb.TableMaster.model.enums.OrderItemStatus.DELIVERED);
                }
            });
        }

        OrderDTO orderDTO = orderMapper.toDTO(paidOrder);
        return orderDTO;
    }

    public List<OrderDTO> findByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status)
                .stream()
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                })
                .toList();
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
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                })
                .toList();
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                })
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderDTOById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        order.getItems().size();
        return orderMapper.toDTO(order);
    }

    @Transactional
    public void recalculateOrderTotal(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        List<OrderItem> orderItems = order.getItems();
        if (orderItems == null) {
            orderItems = new ArrayList<>();
        }

        BigDecimal total = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalValue(total);
        Order savedOrder = orderRepository.save(order);

        System.out.println("DEBUG WS Backend: Enviando OrderUpdate (recalculateTotal) para: " + savedOrder.getId() + " - Novo Total: " + savedOrder.getTotalValue());
        webSocketController.sendOrderUpdate(orderMapper.toDTO(savedOrder));
    }

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
                .status(OrderStatus.OPEN)
                .totalValue(java.math.BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();
        Order savedOrder = orderRepository.save(order);

        OrderDTO orderDTO = orderMapper.toDTO(savedOrder);
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    @Transactional
    public OrderDTO confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getItems().isEmpty()) {
            throw new IllegalStateException("Order has no items and cannot be confirmed.");
        }

        order.setStatus(OrderStatus.OPEN);
        order.getTable().setStatus(TableStatus.OCCUPIED);
        tableRepository.save(order.getTable());

        Order savedOrder = orderRepository.save(order);
        OrderDTO orderDTO = orderMapper.toDTO(savedOrder);
        webSocketController.sendOrderUpdate(orderDTO);
        webSocketController.sendTableUpdate(restaurantTableMapper.toDTO(order.getTable()));
        notificationService.publishNewOrder(order.getTable().getId(), order.getId());
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
        Order savedOrder = orderRepository.save(order);

        OrderDTO orderDTO = orderMapper.toDTO(savedOrder);
        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }

    public Optional<OrderDTO> getCurrentDraftOrderByUser(String userCpf) {
        return orderRepository.findByUserCpfAndStatus(userCpf, OrderStatus.OPEN)
                .map(order -> {
                    order.getItems().size();
                    return orderMapper.toDTO(order);
                });
    }

    @Transactional
    public OrderDTO requestPayment(Long orderId, PaymentMethod requestedPaymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Pedido já está pago.");
        }
        if (order.getStatus() == OrderStatus.UNPAID) {
            return orderMapper.toDTO(order);
        }

        order.setStatus(OrderStatus.UNPAID);
        Order updatedOrder = orderRepository.save(order);

        OrderDTO updatedOrderDTO = orderMapper.toDTO(updatedOrder);
        webSocketController.sendOrderUpdate(updatedOrderDTO);
        return updatedOrderDTO;
    }

    @Transactional
    public OrderDTO confirmAndOpenOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        order.setStatus(OrderStatus.OPEN);
        Order savedOrder = orderRepository.save(order);
        OrderDTO orderDTO = orderMapper.toDTO(savedOrder);

        webSocketController.sendOrderUpdate(orderDTO);
        return orderDTO;
    }
}