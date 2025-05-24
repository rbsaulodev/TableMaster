package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.repository.MenuItemRepository;
import com.rb.TableMaster.repository.OrderItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
@AllArgsConstructor
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

    public OrderItemDTO findById(@NotNull @Positive Long id) {
        return orderItemRepository.findById(id)
                .map(orderItemMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
    }

    public OrderItemDTO create(@Valid @NotNull OrderItemDTO dto, @NotNull @Positive Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        MenuItem menuItem = menuItemRepository.findById(dto.menuItemId())
                .orElseThrow(() -> new RecordNotFoundException(dto.menuItemId(), MenuItem.class));

        OrderItem entity = orderItemMapper.toEntity(dto, menuItem);
        entity.setOrder(order); // Definir a ordem

        OrderItem saved = orderItemRepository.save(entity);
        return orderItemMapper.toDTO(saved);
    }

    public OrderItemDTO update(@Valid @NotNull OrderItemDTO dto, @NotNull @Positive Long id) {
        return orderItemRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setQuantity(dto.quantity());
                    recordFound.setUnitPrice(dto.unitPrice());

                    if (dto.menuItemId() != null &&
                            !dto.menuItemId().equals(recordFound.getMenuItem().getId())) {
                        MenuItem newMenuItem = menuItemRepository.findById(dto.menuItemId())
                                .orElseThrow(() -> new RecordNotFoundException(dto.menuItemId(), MenuItem.class));
                        recordFound.setMenuItem(newMenuItem);
                    }

                    OrderItem updated = orderItemRepository.save(recordFound);
                    return orderItemMapper.toDTO(updated);
                })
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
    }

    public void delete(@NotNull @Positive Long id) {
        OrderItem item = orderItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, OrderItem.class));
        orderItemRepository.delete(item);
    }

    public List<OrderItemDTO> listByOrderId(@NotNull @Positive Long orderId) {
        return orderItemRepository.findByOrderId(orderId).stream()
                .map(orderItemMapper::toDTO)
                .toList();
    }
}