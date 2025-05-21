package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.OrderItem;
import org.springframework.stereotype.Component;

@Component
public class OrderItemMapper {

    public OrderItemDTO toDTO(OrderItem entity) {
        if (entity == null) {
            return null;
        }

        return new OrderItemDTO(
                entity.getId(),
                entity.getMenuItem().getId(),
                entity.getMenuItem().getName(),
                entity.getQuantity(),
                entity.getUnitPrice()
        );
    }

    public OrderItem toEntity(OrderItemDTO dto, MenuItem menuItem) {
        if (dto == null) {
            return null;
        }

        OrderItem entity = new OrderItem();
        entity.setId(dto.id());
        entity.setMenuItem(menuItem);
        entity.setQuantity(dto.quantity());
        entity.setUnitPrice(dto.unitPrice());
        return entity;
    }
}