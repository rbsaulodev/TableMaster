package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
// import com.rb.TableMaster.event.OrderItemEventPublisher; // Removida, pois não é uma dependência direta no construtor assim
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.repository.OrderItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.MenuItemRepository;
// import lombok.RequiredArgsConstructor; // Remova esta, se usar construtor explícito
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy; // Manter este import

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional; // Import para Optional
import java.util.stream.Collectors;

@Service
// @RequiredArgsConstructor // Remova esta anotação se usar construtor explícito
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final WebSocketController webSocketController;
    private final OrderService orderService; // <<=== CORRIGIDO AQUI: Injete OrderService (com @Lazy para circularidade)

    // CONSTRUTOR EXPLÍCITO para controlar a injeção @Lazy
    public OrderItemService(
            OrderItemRepository orderItemRepository,
            OrderItemMapper orderItemMapper,
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            WebSocketController webSocketController,
            @Lazy OrderService orderService) { // <<=== INJEÇÃO CORRIGIDA PARA OrderService
        this.orderItemRepository = orderItemRepository;
        this.orderItemMapper = orderItemMapper;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.webSocketController = webSocketController;
        this.orderService = orderService; // Atribua a dependência injetada
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

        // Busca o item existente dentro da coleção do pedido para evitar buscar novamente
        // e para garantir que o objeto Order é gerenciado pela mesma sessão Hibernate.
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
                    .status(OrderItemStatus.PENDING) // Status inicial para novo item
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            order.getItems().add(orderItem); // Adiciona ao pedido
        }
        OrderItem savedItem = orderItemRepository.save(orderItem); // Salva o item de pedido

        // Recalcular o total do pedido principal e salvar
        orderService.recalculateOrderTotal(order.getId()); // Chama o método do OrderService

        OrderItemDTO itemDTO = orderItemMapper.toDTO(savedItem);
        // Enviar atualização via WebSocket
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (addOrderItem) para: " + itemDTO.id() + " - Qtd: " + itemDTO.quantity());
        webSocketController.sendOrderItemUpdate(itemDTO);
        return itemDTO;
    }

    @Transactional // Adicionado @Transactional para garantir persistência
    public OrderItemDTO updateQuantity(Long orderItemId, int newQuantity) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RecordNotFoundException(orderItemId, OrderItem.class));

        // Note: A validação de autorização (userCpf) pode ser feita aqui ou no Controller
        // se a lógica de segurança for mais complexa. No exemplo anterior, o Controller passava.
        // Se este método é chamado de um Controller sem userCpf, remova o userCpf do construtor.
        // Assumindo que o Spring Security já autorizou a requisição ao controller.

        if (newQuantity <= 0) {
            removeOrderItem(orderItemId); // Delega para o método de exclusão
            return null; // Retorna null ou um DTO com status de "removido" se a API permitir
        }

        orderItem.setQuantity(newQuantity);
        orderItem.setTotalPrice(orderItem.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
        orderItem.setUpdatedAt(LocalDateTime.now());

        OrderItem savedItem = orderItemRepository.save(orderItem);

        // Recalcular o total do pedido principal
        orderService.recalculateOrderTotal(savedItem.getOrder().getId());

        OrderItemDTO savedItemDTO = orderItemMapper.toDTO(savedItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (update quantity) para: " + savedItemDTO.id() + " - Nova Qtd: " + savedItemDTO.quantity());
        webSocketController.sendOrderItemUpdate(savedItemDTO); // Publica atualização do item
        // A atualização do pedido principal já é feita via orderService.recalculateOrderTotal
        // que por sua vez chama webSocketController.sendOrderUpdate.

        return savedItemDTO;
    }

    @Transactional // Adicionado @Transactional para garantir persistência
    public void removeOrderItem(Long orderItemId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RecordNotFoundException(orderItemId, OrderItem.class));

        // Note: A validação de autorização (userCpf) pode ser feita aqui ou no Controller.
        // Assumindo que o Spring Security já autorizou a requisição ao controller.

        Long orderId = orderItem.getOrder().getId(); // Salva o ID do pedido antes de deletar o item
        orderItemRepository.delete(orderItem);

        // Recalcular o total do pedido principal após a remoção do item
        orderService.recalculateOrderTotal(orderId);

        // Notificar via WebSocket que o item foi removido
        // Uma forma é enviar o item com quantidade 0 para o frontend
        orderItem.setQuantity(0); // Sinaliza a remoção no WS
        OrderItemDTO deletedItemDTO = orderItemMapper.toDTO(orderItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (delete) para: " + deletedItemDTO.id() + " - Qtd: " + deletedItemDTO.quantity());
        webSocketController.sendOrderItemUpdate(deletedItemDTO); // Publica que o item foi removido
        // A atualização do pedido principal já é feita via orderService.recalculateOrderTotal
        // que por sua vez chama webSocketController.sendOrderUpdate.
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
        OrderItem savedItem = orderItemRepository.save(item); // Salvar a entidade após a mudança de status
        OrderItemDTO itemDTO = orderItemMapper.toDTO(savedItem);
        System.out.println("DEBUG WS Backend: Enviando OrderItemUpdate (update status) para: " + itemDTO.id() + " - Status: " + itemDTO.status());
        webSocketController.sendOrderItemUpdate(itemDTO); // Publica atualização do item
        return itemDTO;
    }
}