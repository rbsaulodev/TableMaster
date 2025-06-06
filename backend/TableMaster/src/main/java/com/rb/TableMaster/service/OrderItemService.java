package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.repository.MenuItemRepository;
import com.rb.TableMaster.repository.OrderItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final WebSocketController webSocketController;
    private final OrderService orderService; // Precisa ser @Lazy se houver dependência circular

    public OrderItemService(
            OrderItemRepository orderItemRepository,
            OrderItemMapper orderItemMapper,
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            WebSocketController webSocketController,
            @Lazy OrderService orderService) {
        this.orderItemRepository = orderItemRepository;
        this.orderItemMapper = orderItemMapper;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.webSocketController = webSocketController;
        this.orderService = orderService;
    }

    public OrderItem findEntityById(Long id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
    }

    public OrderItemDTO getOrderItemById(Long id) {
        OrderItem orderItem = orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
        return orderItemMapper.toDTO(orderItem);
    }

    @Transactional
    public OrderItemDTO addOrderItem(Long orderId, Long menuItemId, int quantity) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RecordNotFoundException(menuItemId, MenuItem.class));

        if (!menuItem.isAvailable()) {
            throw new IllegalStateException("MenuItem is currently not available.");
        }

        Optional<OrderItem> existingItemOptional = order.getItems().stream()
                .filter(oi -> oi.getMenuItem().getId().equals(menuItemId))
                .findFirst();

        OrderItem orderItem;
        if (existingItemOptional.isPresent()) {
            orderItem = existingItemOptional.get();
            orderItem.setQuantity(orderItem.getQuantity() + quantity);
            orderItem.setTotalPrice(orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity())));
            orderItem.setUpdatedAt(LocalDateTime.now());
        } else {
            orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(quantity)
                    .unitPrice(menuItem.getPrice())
                    .totalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(quantity)))
                    .status(OrderItemStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            order.getItems().add(orderItem);
        }
        OrderItem savedItem = orderItemRepository.save(orderItem);

        orderService.recalculateOrderTotal(order.getId());

        OrderItemDTO itemDTO = orderItemMapper.toDTO(savedItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (addOrderItem) para: " + itemDTO.id() + " - Qtd: " + itemDTO.quantity());
        webSocketController.sendOrderItemUpdate(itemDTO);
        return itemDTO;
    }

    @Transactional
    public OrderItemDTO updateQuantity(Long orderItemId, int newQuantity) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RecordNotFoundException(orderItemId, OrderItem.class));

        if (newQuantity <= 0) {
            removeOrderItem(orderItemId); // Delega para o método de exclusão
            return null;
        }

        orderItem.setQuantity(newQuantity);
        orderItem.setTotalPrice(orderItem.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
        orderItem.setUpdatedAt(LocalDateTime.now());

        OrderItem savedItem = orderItemRepository.save(orderItem);
        orderService.recalculateOrderTotal(savedItem.getOrder().getId());

        OrderItemDTO savedItemDTO = orderItemMapper.toDTO(savedItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (update quantity) para: " + savedItemDTO.id() + " - Nova Qtd: " + savedItemDTO.quantity());
        webSocketController.sendOrderItemUpdate(savedItemDTO);
        return savedItemDTO;
    }

    @Transactional
    public void removeOrderItem(Long orderItemId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RecordNotFoundException(orderItemId, OrderItem.class));

        Long orderId = orderItem.getOrder().getId();
        orderItemRepository.delete(orderItem);

        orderService.recalculateOrderTotal(orderId);

        OrderItemDTO deletedItemDTO = new OrderItemDTO(
                orderItem.getId(), orderItem.getOrder().getId(), orderItem.getMenuItem().getId(),
                orderItem.getMenuItem().getName(), orderItem.getMenuItem().getDescription(),
                0,
                orderItem.getUnitPrice(), BigDecimal.ZERO, OrderItemStatus.DELIVERED
        );
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (delete) para: " + deletedItemDTO.id() + " - Qtd: " + deletedItemDTO.quantity());
        webSocketController.sendOrderItemUpdate(deletedItemDTO);
    }

    public List<OrderItemDTO> getItemsByStatus(OrderItemStatus status) {
        return orderItemRepository.findByStatus(status).stream()
                .map(orderItemMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderItemDTO updateItemStatus(Long itemId, OrderItemStatus newStatus) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RecordNotFoundException(itemId, OrderItem.class));
        item.setStatus(newStatus);
        item.setUpdatedAt(LocalDateTime.now());
        OrderItem savedItem = orderItemRepository.save(item);
        OrderItemDTO itemDTO = orderItemMapper.toDTO(savedItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (update status) para: " + itemDTO.id() + " - Status: " + itemDTO.status());
        webSocketController.sendOrderItemUpdate(itemDTO);
        return itemDTO;
    }
}