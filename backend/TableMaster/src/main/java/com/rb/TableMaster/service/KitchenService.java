package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenService {

    private final OrderItemService orderItemService;
    private final NotificationService notificationService;

    public List<OrderItemDTO> getPendingItems() {
        return orderItemService.getItemsByStatus(OrderItemStatus.PENDING);
    }

    public List<OrderItemDTO> getPreparingItems() {
        return orderItemService.getItemsByStatus(OrderItemStatus.PREPARING);
    }

    public List<OrderItemDTO> getReadyItems() {
        return orderItemService.getItemsByStatus(OrderItemStatus.READY);
    }

    @Transactional
    public OrderItemDTO startPreparing(Long itemId) {
        OrderItemDTO item = orderItemService.updateItemStatus(itemId, OrderItemStatus.PREPARING);
        notificationService.notifyItemInPreparation(itemId);
        return item;
    }

    @Transactional
    public OrderItemDTO markAsReady(Long itemId) {
        OrderItemDTO item = orderItemService.updateItemStatus(itemId, OrderItemStatus.READY);
        notificationService.notifyItemReady(itemId);
        return item;
    }

    public List<OrderItemDTO> getItemsByStatus(OrderItemStatus status) {
        return orderItemService.getItemsByStatus(status);
    }
}