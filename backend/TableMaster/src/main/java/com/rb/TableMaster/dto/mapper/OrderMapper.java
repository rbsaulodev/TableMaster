package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    private final OrderItemMapper orderItemMapper;

    public OrderMapper(OrderItemMapper orderItemMapper) {
        this.orderItemMapper = orderItemMapper;
    }

    public OrderDTO toDTO(Order order) {
        if (order == null) return null;

        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(orderItemMapper::toDTO)
                .collect(Collectors.toList());

        return new OrderDTO(
                order.getId(),
                order.getTable().getId(),
                order.getUser().getCpf(),
                itemDTOs,
                order.getCreatedAt(),
                order.getStatus()
        );
    }

    public Order toEntity(OrderDTO dto, RestaurantTable table, User user, List<MenuItem> menuItems) {
        if (dto == null) return null;

        Order order = new Order();
        if (dto.id() != null) {
            order.setId(dto.id());
        }

        order.setTable(table);
        order.setUser(user);
        order.setCreatedAt(dto.createdAt() != null ? dto.createdAt() : LocalDateTime.now());
        order.setStatus(dto.status());

        List<OrderItem> items = new ArrayList<>();
        for (OrderItemDTO itemDTO : dto.items()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);

            MenuItem menuItem = menuItems.stream()
                    .filter(mi -> mi.getId().equals(itemDTO.menuItemId()))
                    .findFirst()
                    .orElse(null);

            item.setMenuItem(menuItem);
            item.setQuantity(itemDTO.quantity());
            items.add(item);
        }

        order.setItems(items);
        return order;
    }

}