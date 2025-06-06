package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.dto.mapper.NotificationMapper;
import com.rb.TableMaster.event.OrderEventPublisher;
import com.rb.TableMaster.event.OrderItemEventPublisher;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Notification;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.model.enums.NotificationType;
import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.repository.NotificationRepository;
import com.rb.TableMaster.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationService implements OrderItemEventPublisher, OrderEventPublisher {

    private final ConcurrentLinkedQueue<NotificationDTO> notificationsQueue = new ConcurrentLinkedQueue<>();
    private final OrderRepository orderRepository;
    private final OrderItemService orderItemService;
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final WebSocketController webSocketController;

    public NotificationService(
            OrderRepository orderRepository,
            @Lazy OrderItemService orderItemService,
            NotificationRepository notificationRepository,
            NotificationMapper notificationMapper,
            WebSocketController webSocketController) {
        this.orderRepository = orderRepository;
        this.orderItemService = orderItemService;
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.webSocketController = webSocketController;
    }


    @Override
    @Transactional
    public void publishItemStatusChanged(Long itemId, OrderItemStatus newStatus) {
        OrderItem item = orderItemService.findEntityById(itemId);
        if (item == null || item.getOrder() == null || item.getOrder().getTable() == null || item.getMenuItem() == null) {
            log.warn("Não foi possível criar notificação para mudança de status do item ID: {}. Dados incompletos.", itemId);
            return;
        }
        if (newStatus == OrderItemStatus.PREPARING) {
            notifyItemInPreparation(item);
        } else if (newStatus == OrderItemStatus.READY) {
            notifyItemReady(item);
        }
    }

    @Override
    @Transactional
    public void publishNewOrderItem(Long itemId) {
        OrderItem item = orderItemService.findEntityById(itemId);
        if (item == null || item.getOrder() == null || item.getOrder().getTable() == null || item.getMenuItem() == null) {
            log.warn("Não foi possível criar notificação para novo item ID: {}. Dados incompletos.", itemId);
            return;
        }
        notifyNewOrderItem(item);
    }

    @Override
    @Transactional
    public void publishNewOrder(Long tableId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        User user = order.getUser();
        RestaurantTable table = order.getTable();

        if (user == null || table == null) {
            log.warn("Não foi possível criar notificação para novo pedido ID: {}. Usuário ou Mesa não encontrado.", orderId);
            return;
        }

        // CORREÇÃO AQUI: Adicionar null check para order.getItems()
        String itemsSummary = (order.getItems() != null && !order.getItems().isEmpty()) ?
                order.getItems().stream()
                        .filter(item -> item.getMenuItem() != null)
                        .map(item -> String.format("%dx %s", item.getQuantity(), item.getMenuItem().getName()))
                        .collect(Collectors.joining(", "))
                : "Nenhum item ainda";


        NotificationDTO notification = NotificationDTO.builder()
                .id(null)
                .title("Nova Comanda Aberta")
                .message(String.format("Mesa %d (%s) iniciou uma nova comanda #%d. Itens: %s.",
                        table.getNumber(),
                        user.getFullName(),
                        order.getId(),
                        itemsSummary))
                .timestamp(LocalDateTime.now())
                .tableId(table.getId())
                .tableNumber(table.getNumber())
                .orderId(order.getId())
                .itemId(null)
                .itemName(null)
                .userName(user.getFullName())
                .itemsSummary(itemsSummary.isEmpty() ? null : itemsSummary)
                .notificationType(NotificationType.ORDER_STATUS_UPDATE)
                .build();

        notificationsQueue.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação (em memória) criada - Nova comanda aberta: {}", notification.message());
    }

    @Override
    @Transactional
    public void publishAccountRequest(Long tableId, Long orderId, PaymentMethod requestedPaymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        User user = order.getUser();
        RestaurantTable table = order.getTable();

        if (user == null || table == null) {
            log.warn("Não foi possível criar notificação de solicitação de conta para pedido ID: {}. Usuário ou Mesa não encontrado.", orderId);
            return;
        }

        createAccountRequestedNotification(order, requestedPaymentMethod);
        log.info("Notificação de Solicitação de Conta disparada para persistência e WS para pedido ID: {}", orderId);
    }


    private void notifyItemReady(OrderItem item) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(null)
                .title("Item Pronto")
                .message(String.format("Item %s da mesa %d está pronto para entrega",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()))
                .timestamp(LocalDateTime.now())
                .tableId(item.getOrder().getTable().getId())
                .tableNumber(item.getOrder().getTable().getNumber())
                .orderId(item.getOrder().getId())
                .itemId(item.getId())
                .itemName(item.getMenuItem().getName())
                .userName(item.getOrder().getUser() != null ? item.getOrder().getUser().getFullName() : null)
                .itemsSummary(null)
                .notificationType(NotificationType.ITEM_STATUS_UPDATE)
                .build();

        notificationsQueue.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação (em memória) criada - Item pronto: {}", notification.message());
    }

    private void notifyNewOrderItem(OrderItem item) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(null)
                .title("Novo Item no Pedido")
                .message(String.format("Cliente da mesa %d adicionou: %s",
                        item.getOrder().getTable().getNumber(),
                        item.getMenuItem().getName())) // <-- CORREÇÃO AQUI: item.getMenuItem().getName()
                .timestamp(LocalDateTime.now())
                .tableId(item.getOrder().getTable().getId())
                .tableNumber(item.getOrder().getTable().getNumber())
                .orderId(item.getOrder().getId())
                .itemId(item.getId())
                .itemName(item.getMenuItem().getName())
                .userName(item.getOrder().getUser() != null ? item.getOrder().getUser().getFullName() : null)
                .itemsSummary(null)
                .notificationType(NotificationType.ITEM_STATUS_UPDATE)
                .build();

        notificationsQueue.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação (em memória) criada - Novo item no pedido: {}", notification.message());
    }

    private void notifyItemInPreparation(OrderItem item) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(null)
                .title("Item em Preparo")
                .message(String.format("Item %s da mesa %d está sendo preparado na cozinha",
                        item.getMenuItem().getName(),
                        item.getOrder().getTable().getNumber()))
                .timestamp(LocalDateTime.now())
                .tableId(item.getOrder().getTable().getId())
                .tableNumber(item.getOrder().getTable().getNumber())
                .orderId(item.getOrder().getId())
                .itemId(item.getId())
                .itemName(item.getMenuItem().getName())
                .userName(item.getOrder().getUser() != null ? item.getOrder().getUser().getFullName() : null)
                .itemsSummary(null)
                .notificationType(NotificationType.ITEM_STATUS_UPDATE)
                .build();

        notificationsQueue.offer(notification);
        webSocketController.sendNotification(notification);
        log.info("Notificação (em memória) criada - Item em preparo: {}", notification.message());
    }

    @Transactional
    public void createAccountRequestedNotification(Order order, PaymentMethod requestedPaymentMethod) {
        if (order.getTable() == null || order.getUser() == null) {
            log.error("Tentativa de criar notificação de conta para pedido ID {} sem mesa ou usuário associado.", order.getId());
            return;
        }

        String message = String.format("Mesa %d (Cliente: %s) solicitou a conta. Forma de Pgto. Sugerida: %s.",
                order.getTable().getNumber(),
                order.getUser().getFullName(),
                requestedPaymentMethod != null ? requestedPaymentMethod.name() : "Não informada");

        Notification notificationEntity = new Notification();
        notificationEntity.setTitle("Solicitação de Conta");
        notificationEntity.setMessage(message);
        notificationEntity.setTimestamp(LocalDateTime.now());
        notificationEntity.setTableId(order.getTable().getId());
        notificationEntity.setTableNumber(order.getTable().getNumber());
        notificationEntity.setOrderId(order.getId());
        notificationEntity.setUserName(order.getUser().getFullName());
        notificationEntity.setRequestedPaymentMethod(requestedPaymentMethod);
        notificationEntity.setNotificationType(NotificationType.ACCOUNT_REQUEST);
        notificationEntity.setRead(false);

        Notification savedNotification = notificationRepository.save(notificationEntity);
        NotificationDTO dto = notificationMapper.toDTO(savedNotification);

        notificationsQueue.offer(dto);
        webSocketController.sendAccountRequestNotification(dto);
        log.info("Notificação (persistida) criada - Solicitação de conta: {}", dto.message());
    }

    public List<NotificationDTO> getUnreadNotifications() {
        return new ArrayList<>(notificationsQueue);
    }

    public List<NotificationDTO> getUnreadAccountRequestNotifications() {
        return notificationRepository.findByNotificationTypeAndIsReadFalseOrderByTimestampDesc(NotificationType.ACCOUNT_REQUEST)
                .stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsReadByItemId(Long itemId) {
        List<Notification> persistedNotifications = notificationRepository.findByItemIdAndIsReadFalse(itemId);
        persistedNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(persistedNotifications);

        notificationsQueue.removeIf(notificationDTO ->
                notificationDTO.itemId() != null && notificationDTO.itemId().equals(itemId));
        log.info("Notificações para item ID {} marcadas como lidas e removidas da fila.", itemId);
    }

    @Transactional
    public void markOrderNotificationAsRead(Long orderId, NotificationType notificationType) {
        List<Notification> persistedNotifications = notificationRepository.findByOrderIdAndNotificationTypeAndIsReadFalse(orderId, notificationType);
        persistedNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(persistedNotifications);

        notificationsQueue.removeIf(notificationDTO ->
                notificationDTO.orderId() != null && notificationDTO.orderId().equals(orderId) &&
                        notificationType.equals(notificationDTO.notificationType()));
        log.info("Notificação '{}' para pedido ID {} marcada como lida e removida da fila.", notificationType.name(), orderId);
    }

    @Transactional
    public void markAccountRequestNotificationAsProcessed(Long orderId) {
        List<Notification> notificationsToMark = notificationRepository.findByOrderIdAndNotificationTypeAndIsReadFalse(orderId, NotificationType.ACCOUNT_REQUEST);
        for (Notification n : notificationsToMark) {
            n.setRead(true);
            notificationRepository.save(n);
        }

        notificationsQueue.removeIf(dto -> dto.orderId() != null && dto.orderId().equals(orderId) && dto.notificationType() == NotificationType.ACCOUNT_REQUEST);
        log.info("Notificações de solicitação de conta para o pedido {} foram marcadas como processadas.", orderId);
    }


    public void clearNotifications() {
        notificationsQueue.clear();
        log.info("Fila de notificações em memória foi limpa.");
    }

    public int getNotificationCount() {
        return notificationsQueue.size();
    }
}