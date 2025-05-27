package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class OrderItemMapper {

    public OrderItemDTO toDTO(OrderItem entity) {
        if (entity == null) {
            return null;
        }

        Integer quantity = entity.getQuantity();
        BigDecimal unitPrice = entity.getUnitPrice();

        BigDecimal totalPrice = BigDecimal.ZERO;
        if (unitPrice != null && quantity > 0) {
            totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }

        return new OrderItemDTO(
                entity.getId(),
                entity.getOrder() != null ? entity.getOrder().getId() : null,
                entity.getMenuItem() != null ? entity.getMenuItem().getId() : null,
                entity.getMenuItem() != null ? entity.getMenuItem().getName() : null,
                entity.getMenuItem() != null ? entity.getMenuItem().getDescription() : null,
                entity.getQuantity(),
                entity.getUnitPrice(),
                totalPrice,
                entity.getStatus() != null ? entity.getStatus() : OrderItemStatus.PENDING
        );
    }

    public OrderItem toEntity(OrderItemDTO dto, MenuItem menuItem) {
        if (dto == null || menuItem == null) {
            return null;
        }

        OrderItem entity = new OrderItem();
        entity.setId(dto.id());
        entity.setMenuItem(menuItem);
        entity.setQuantity(dto.quantity());
        entity.setUnitPrice(dto.unitPrice());
        entity.setStatus(dto.status() != null ? dto.status() : OrderItemStatus.PENDING);

        return entity;
    }

    public void updateEntity(OrderItemDTO dto, OrderItem entity, MenuItem menuItem) {
        if (dto == null || entity == null || menuItem == null) {
            return;
        }

        entity.setMenuItem(menuItem);
        entity.setQuantity(dto.quantity());
        entity.setUnitPrice(dto.unitPrice());
        if (dto.status() != null) {
            entity.setStatus(dto.status());
        }
    }
}