package com.rb.TableMaster.service;

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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemService {
    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    public List<OrderItemDTO> list() {
        return orderItemRepository.findAll().stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    public OrderItemDTO findById(Long id) {
        return orderItemRepository.findById(id)
                .map(orderItemMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
    }

    public OrderItem findEntityById(Long id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
    }

    public List<OrderItemDTO> getItemsByOrder(Long orderId) {
        return orderItemRepository.findByOrderId(orderId).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    public List<OrderItemDTO> getItemsByStatus(OrderItemStatus status) {
        return orderItemRepository.findByStatus(status).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }

    @Transactional
    public OrderItemDTO create(OrderItemDTO dto, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        MenuItem menuItem = menuItemRepository.findById(dto.menuItemId())
                .orElseThrow(() -> new RecordNotFoundException(dto.menuItemId(), MenuItem.class));

        OrderItem orderItem = orderItemMapper.toEntity(dto, menuItem);
        orderItem.setOrder(order);

        OrderItem savedItem = orderItemRepository.save(orderItem);
        return orderItemMapper.toDTO(savedItem);
    }

    @Transactional
    public OrderItemDTO update(OrderItemDTO dto, Long id) {
        OrderItem existingItem = orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));

        MenuItem menuItem = menuItemRepository.findById(dto.menuItemId())
                .orElseThrow(() -> new RecordNotFoundException(dto.menuItemId(), MenuItem.class));

        orderItemMapper.updateEntity(dto, existingItem, menuItem);
        OrderItem updatedItem = orderItemRepository.save(existingItem);
        return orderItemMapper.toDTO(updatedItem);
    }

    @Transactional
    public OrderItemDTO updateItemStatus(Long itemId, OrderItemStatus newStatus) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RecordNotFoundException(itemId, OrderItem.class));

        item.setStatus(newStatus);
        OrderItem updatedItem = orderItemRepository.save(item);
        return orderItemMapper.toDTO(updatedItem);
    }

    @Transactional
    public OrderItemDTO updateQuantity(Long id, int newQuantity) {
        OrderItem item = orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));

        item.setQuantity(newQuantity);
        OrderItem updatedItem = orderItemRepository.save(item);
        return orderItemMapper.toDTO(updatedItem);
    }

    @Transactional
    public void delete(Long id) {
        OrderItem item = orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
        orderItemRepository.delete(item);
    }
}