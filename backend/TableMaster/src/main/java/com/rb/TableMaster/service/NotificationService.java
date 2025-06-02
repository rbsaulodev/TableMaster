package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.event.OrderEventPublisher;
import com.rb.TableMaster.event.OrderItemEventPublisher;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy; // Manter este import
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Manter para quando o método for público

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors; // Necessário para .stream().collect(Collectors.joining())

@Slf4j
@Service
public class NotificationService implements OrderItemEventPublisher, OrderEventPublisher {

    private final ConcurrentLinkedQueue<NotificationDTO> notifications = new ConcurrentLinkedQueue<>();
    private final OrderRepository orderRepository;

    private final OrderItemService orderItemService; // Mantenha sem @Lazy aqui, mova para o construtor

    private final WebSocketController webSocketController;


    // Construtor explícito CORRIGIDO: @Lazy no parâmetro
    public NotificationService(
            OrderRepository orderRepository,
            @Lazy OrderItemService orderItemService, // <<< ADICIONE @Lazy AQUI!
            WebSocketController webSocketController) {
        this.orderRepository = orderRepository;
        this.orderItemService = orderItemService;
        this.webSocketController = webSocketController;
    }


    // Implementações dos métodos da interface OrderItemEventPublisher
    @Override
    @Transactional
    public void publishItemStatusChanged(Long itemId, OrderItemStatus newStatus) {
        // O orderItemService só será inicializado quando realmente for chamado o método findEntityById
        OrderItem item = orderItemService.findEntityById(itemId);
        if (newStatus == OrderItemStatus.PREPARING) {
            notifyItemInPreparation(item);
        } else if (newStatus == OrderItemStatus.READY) {
            notifyItemReady(item);
        }
    }

    @Override
    @Transactional
    public void publishNewOrderItem(Long itemId) {
        OrderItem item = orderItemService.findEntityById(itemId); // Busca a entidade OrderItem
        notifyNewOrderItem(item);
    }

    // Implementações dos métodos da interface OrderEventPublisher
    @Override
    @Transactional
    public void publishNewOrder(Long tableId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        // Gerar resumo dos itens
        String itemsSummary = order.getItems().stream()
                .map(item -> String.format("%dx %s", item.getQuantity(), item.getMenuItem().getName()))
                .collect(Collectors.joining(", "));

        NotificationDTO notification = new NotificationDTO(
                "Nova Comanda Aberta", // Título para o garçom
                String.format("Mesa %d (%s) iniciou uma nova comanda #%d. Itens: %s.",
                        order.getTable().getNumber(),
                        order.getUser().getFullName(),
                        order.getId(),
                        itemsSummary),
                LocalDateTime.now(),
                order.getTable().getId(),
                order.getTable().getNumber(),
                order.getId(),
                null,          // itemId é null
                null,          // itemName é null
                order.getUser().getFullName(), // userName
                itemsSummary   // itemsSummary
        );
        notifications.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação criada - Nova comanda aberta: {}", notification.message());
    }

    @Override
    @Transactional
    public void publishAccountRequest(Long tableId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        NotificationDTO notification = new NotificationDTO(
                "Solicitação de Conta",
                String.format("Mesa %d (%s) solicitou a conta. Valor total: R$ %.2f",
                        order.getTable().getNumber(),
                        order.getUser().getFullName(),
                        order.getTotalValue()),
                LocalDateTime.now(),
                order.getTable().getId(),
                order.getTable().getNumber(),
                order.getId(),
                null,          // itemId é null
                null,          // itemName é null
                order.getUser().getFullName(), // userName
                null           // itemsSummary é null
        );
        notifications.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação criada - Solicitação de conta: {}", notification.message());
    }


    // Métodos privados que constroem e adicionam as notificações à fila
    private void notifyItemReady(OrderItem item) {
        NotificationDTO notification = new NotificationDTO(
                "Item Pronto",
                String.format("Item %s da mesa %d está pronto para entrega",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getOrder().getId(),
                item.getId(),
                item.getMenuItem().getName(),
                null,
                null
        );
        notifications.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação criada - Item pronto: {}", notification.message());
    }

    private void notifyNewOrderItem(OrderItem item) {
        NotificationDTO notification = new NotificationDTO(
                "Novo Item no Pedido",
                String.format("Cliente da mesa %d adicionou: %s",
                        item.getOrder().getTable().getNumber(),
                        item.getMenuItem().getName()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getOrder().getId(),
                item.getId(),
                item.getMenuItem().getName(),
                null,
                null
        );
        notifications.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação criada - Novo item no pedido: {}", notification.message());
    }

    private void notifyItemInPreparation(OrderItem item) {
        NotificationDTO notification = new NotificationDTO(
                "Item em Preparo",
                String.format("Item %s da mesa %d está sendo preparado na cozinha",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()),
                LocalDateTime.now(),
                item.getOrder().getTable().getId(),
                item.getOrder().getTable().getNumber(),
                item.getOrder().getId(),
                item.getId(),
                item.getMenuItem().getName(),
                null,
                null
        );
        notifications.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação criada - Item em preparo: {}", notification.message());
    }


    // Métodos para acesso externo (APIs ou outros serviços para consumir notificações)
    public List<NotificationDTO> getUnreadNotifications() {
        List<NotificationDTO> unread = new ArrayList<>(notifications);
        notifications.clear();
        return unread;
    }

    public List<NotificationDTO> getWaiterNotifications() {
        List<NotificationDTO> relevantNotifications = notifications.stream()
                .filter(n -> n.title().equals("Nova Comanda Aberta") ||
                        n.title().equals("Item Pronto") ||
                        n.title().equals("Solicitação de Conta"))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
        return relevantNotifications;
    }

    public List<NotificationDTO> getChefNotifications() {
        List<NotificationDTO> relevantNotifications = notifications.stream()
                .filter(n -> n.title().equals("Novo Item no Pedido") ||
                        n.title().equals("Item em Preparo") ||
                        n.title().equals("Item Pronto"))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
        return relevantNotifications;
    }

    public void markAsRead(Long itemId) {
        notifications.removeIf(notification ->
                notification.itemId() != null && notification.itemId().equals(itemId));
        log.info("Notificação de item marcada como lida para item: {}", itemId);
    }

    public void markOrderNotificationAsRead(Long orderId) {
        notifications.removeIf(notification ->
                notification.orderId() != null && notification.orderId().equals(orderId) && notification.title().equals("Nova Comanda Aberta"));
        log.info("Notificação de nova comanda marcada como lida para orderId: {}", orderId);
    }

    public void clearNotifications() {
        notifications.clear();
        log.info("Todas as notificações foram limpas");
    }

    public int getNotificationCount() {
        return notifications.size();
    }
}