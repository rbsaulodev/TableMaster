package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KitchenService {

    private final OrderItemService orderItemService;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;

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
        return orderItemService.updateItemStatus(itemId, OrderItemStatus.PREPARING);
    }

    @Transactional
    public OrderItemDTO markAsReady(Long itemId) {
        return orderItemService.updateItemStatus(itemId, OrderItemStatus.READY);
    }

    @Transactional
    public OrderItemDTO markAsDelivered(Long itemId) {
        return orderItemService.updateItemStatus(itemId, OrderItemStatus.DELIVERED);
    }

    public List<OrderItemDTO> getItemsByStatus(OrderItemStatus status) {
        return orderItemService.getItemsByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<OrderItemDTO> getDeliveredItems() {
        List<OrderItem> deliveredItems = orderItemRepository.findByStatus(OrderItemStatus.DELIVERED);
        return deliveredItems.stream()
                .map(orderItemMapper::toDTO)
                .collect(Collectors.toList());
    }
}