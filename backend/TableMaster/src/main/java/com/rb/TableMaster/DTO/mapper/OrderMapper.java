package com.rb.TableMaster.DTO.mapper;

import com.rb.TableMaster.DTO.OrderDTO;
import com.rb.TableMaster.DTO.OrderItemDTO;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.RestaurantTable;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderMapper {

    private final OrderItemMapper orderItemMapper;

    public OrderMapper(OrderItemMapper orderItemMapper) {
        this.orderItemMapper = orderItemMapper;
    }

    public OrderDTO toDTO(Order order) {
        if (order == null) {
            return null;
        }

        List<OrderItemDTO> itemsDTO = order.getItems() != null
                ? order.getItems().stream()
                .map(orderItemMapper::toDTO)
                .toList()
                : List.of();

        return new OrderDTO(
                order.getId(),
                order.getTable().getId(),
                order.getCreatedAt(),
                itemsDTO
        );
    }

    public Order toEntity(OrderDTO dto, RestaurantTable table, List<MenuItem> menuItems) {
        if (dto == null) {
            return null;
        }

        Order order = new Order();
        order.setId(dto.id());
        order.setTable(table);
        order.setCreatedAt(dto.createdAt() != null ? dto.createdAt() : LocalDateTime.now());

        List<OrderItem> items = dto.items() != null
                ? dto.items().stream()
                .map(itemDTO -> {
                    MenuItem menuItem = menuItems.stream()
                            .filter(mi -> mi.getId().equals(itemDTO.menuItemId()))
                            .findFirst()
                            .orElseThrow(() -> new RecordNotFoundException(itemDTO.menuItemId(), MenuItem.class));
                    OrderItem orderItem = orderItemMapper.toEntity(itemDTO, menuItem);
                    orderItem.setOrder(order);
                    return orderItem;
                })
                .toList()
                : List.of();

        order.setItems(items);
        return order;
    }
}