package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import com.rb.TableMaster.repository.OrderItemRepository;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
@AllArgsConstructor
public class KitchenService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final NotificationService notificationService;

    public List<OrderItemDTO> getPendingItems() {
        return orderItemRepository.findByStatus(OrderItemStatus.PENDING).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    public List<OrderItemDTO> getPreparingItems() {
        return orderItemRepository.findByStatus(OrderItemStatus.PREPARING).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    public List<OrderItemDTO> getReadyItems() {
        return orderItemRepository.findByStatus(OrderItemStatus.READY).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    @Transactional
    public OrderItemDTO startPreparing(@NotNull @Positive Long itemId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RecordNotFoundException(itemId, OrderItem.class));

        if (item.getStatus() != OrderItemStatus.PENDING) {
            throw new IllegalStateException("Item deve estar pendente para iniciar preparo");
        }

        item.setStatus(OrderItemStatus.PREPARING);
        OrderItem saved = orderItemRepository.save(item);

        return orderItemMapper.toDTO(saved);
    }

    @Transactional
    public OrderItemDTO markAsReady(@NotNull @Positive Long itemId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RecordNotFoundException(itemId, OrderItem.class));

        if (item.getStatus() != OrderItemStatus.PREPARING) {
            throw new IllegalStateException("Item deve estar em preparo para ser marcado como pronto");
        }

        item.setStatus(OrderItemStatus.READY);
        OrderItem saved = orderItemRepository.save(item);

        // Notifica o garçom
        notificationService.notifyItemReady(saved);

        return orderItemMapper.toDTO(saved);
    }

    @Transactional
    public OrderItemDTO markAsDelivered(@NotNull @Positive Long itemId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RecordNotFoundException(itemId, OrderItem.class));

        if (item.getStatus() != OrderItemStatus.READY) {
            throw new IllegalStateException("Item deve estar pronto para ser entregue");
        }

        item.setStatus(OrderItemStatus.DELIVERED);
        OrderItem saved = orderItemRepository.save(item);

        return orderItemMapper.toDTO(saved);
    }
}
