package com.rb.TableMaster.DTO.mapper;

import com.rb.TableMaster.DTO.RestaurantTableDTO;
import com.rb.TableMaster.model.RestaurantTable;
import org.springframework.stereotype.Component;

@Component
public class RestaurantTableMapper {

    public RestaurantTableDTO toDTO(RestaurantTable entity) {
        if (entity == null) {
            return null;
        }

        return new RestaurantTableDTO(
                entity.getId() != null ? entity.getId() : 0L,
                entity.getNumber(),
                entity.getStatus(),
                entity.getCapacity(),
                entity.getOrders()
        );
    }

    public RestaurantTable toEntity(RestaurantTableDTO dto) {
        if (dto == null) {
            return null;
        }

        RestaurantTable entity = new RestaurantTable();

        if (dto.id() != null) {
            entity.setId(dto.id());
        }

        entity.setNumber(dto.number());
        entity.setStatus(dto.status());
        entity.setCapacity(dto.capacity());
        entity.setOrders(dto.orders());

        return entity;
    }
}
