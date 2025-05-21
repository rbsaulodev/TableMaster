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
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderItemService(OrderItemRepository orderItemRepository,
                            OrderItemMapper orderItemMapper,
                            OrderRepository orderRepository,
                            MenuItemRepository menuItemRepository) {
        this.orderItemRepository = orderItemRepository;
        this.orderItemMapper = orderItemMapper;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
    }

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
        // Buscar a ordem pelo ID
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        // Buscar o item do menu pelo ID
        MenuItem menuItem = menuItemRepository.findById(dto.menuItemId())
                .orElseThrow(() -> new RecordNotFoundException(dto.menuItemId(), MenuItem.class));

        // Criar a entidade OrderItem
        OrderItem entity = orderItemMapper.toEntity(dto, menuItem);
        entity.setOrder(order); // Definir a ordem

        // Salvar e retornar
        OrderItem saved = orderItemRepository.save(entity);
        return orderItemMapper.toDTO(saved);
    }

    public OrderItemDTO update(@Valid @NotNull OrderItemDTO dto, @NotNull @Positive Long id) {
        return orderItemRepository.findById(id)
                .map(recordFound -> {
                    // Atualizar apenas os campos editáveis
                    recordFound.setQuantity(dto.quantity());
                    recordFound.setUnitPrice(dto.unitPrice());

                    // Opcionalmente, atualizar o MenuItem se necessário
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
}