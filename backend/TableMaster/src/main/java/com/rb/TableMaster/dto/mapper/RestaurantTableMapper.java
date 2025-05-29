package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.TableStatus;
import org.springframework.stereotype.Component;

@Component
public class RestaurantTableMapper {

    public RestaurantTableDTO toDTO(RestaurantTable entity) {
        if (entity == null) {
            return null;
        }

        return new RestaurantTableDTO(
                entity.getId(),
                entity.getNumber(),
                entity.getStatus() != null ? entity.getStatus() : TableStatus.AVAILABLE,
                entity.getCapacity(),
                entity.getOrders()
        );
    }

    public RestaurantTable toEntity(RestaurantTableDTO dto) {
        if (dto == null) {
            return null;
        }

        RestaurantTable entity = new RestaurantTable();
        entity.setId(dto.id());
        entity.setNumber(dto.number());
        entity.setStatus(dto.status());
        entity.setCapacity(dto.capacity());
        return entity;
    }

    public void updateEntityFromDTO(RestaurantTableDTO dto, RestaurantTable entity) {
        if (dto == null || entity == null) {
            return;
        }

        if (dto.number() > 0) {
            entity.setNumber(dto.number());
        }
        if (dto.status() != null) {
            entity.setStatus(dto.status());
        }
        if (dto.capacity() > 0) {
            entity.setCapacity(dto.capacity());
        }
        // Orders are not updated directly through the table DTO
    }
}