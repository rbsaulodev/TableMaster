package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.NotificationDTO;
import com.rb.TableMaster.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification entity) {
        if (entity == null) {
            return null;
        }

        return new NotificationDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getTimestamp(),
                entity.getTableId(),
                entity.getTableNumber(),
                entity.getOrderId(),
                entity.getItemId(),
                entity.getItemName(),
                entity.getUserName(),
                entity.getItemsSummary(),
                entity.getRequestedPaymentMethod(),
                entity.getNotificationType()
        );
    }

    public Notification toEntity(NotificationDTO dto) {
        if (dto == null) {
            return null;
        }

        Notification entity = new Notification();
        entity.setId(dto.id());

        entity.setTitle(dto.title());
        entity.setMessage(dto.message());
        entity.setTimestamp(dto.timestamp());
        entity.setTableId(dto.tableId());
        entity.setTableNumber(dto.tableNumber());
        entity.setOrderId(dto.orderId());
        entity.setItemId(dto.itemId());
        entity.setItemName(dto.itemName());
        entity.setUserName(dto.userName());
        entity.setItemsSummary(dto.itemsSummary());

        entity.setRequestedPaymentMethod(dto.requestedPaymentMethod());
        entity.setNotificationType(dto.notificationType());

        entity.setRead(false);
        return entity;
    }
}