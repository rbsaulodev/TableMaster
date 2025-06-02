package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenService {

    private final OrderItemService orderItemService;
    // Removido NotificationService diretamente aqui, pois OrderItemService publicará o evento

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
        // orderItemService agora se encarrega de publicar o evento
        OrderItemDTO item = orderItemService.updateItemStatus(itemId, OrderItemStatus.PREPARING);
        return item;
    }

    @Transactional
    public OrderItemDTO markAsReady(Long itemId) {
        // orderItemService agora se encarrega de publicar o evento
        OrderItemDTO item = orderItemService.updateItemStatus(itemId, OrderItemStatus.READY);
        return item;
    }

    public List<OrderItemDTO> getItemsByStatus(OrderItemStatus status) {
        return orderItemService.getItemsByStatus(status);
    }
}