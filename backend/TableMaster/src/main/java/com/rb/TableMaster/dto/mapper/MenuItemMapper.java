package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.model.enums.MenuCategory;
import com.rb.TableMaster.model.enums.DrinkType;
import com.rb.TableMaster.model.MenuItem;
import org.springframework.stereotype.Component;

@Component
public class MenuItemMapper {

    public MenuItemDTO toDTO(MenuItem entity) {
        if (entity == null)
            return null;

        return new MenuItemDTO(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getImageUrl(),
                entity.getCategory(),
                entity.getDrinkType()
        );
    }

    public MenuItem toEntity(MenuItemDTO dto) {
        if (dto == null)
            return null;

        MenuItem entity = new MenuItem();
        entity.setId(dto.id());
        entity.setName(dto.name());
        entity.setDescription(dto.description());
        entity.setPrice(dto.price());
        entity.setImageUrl(dto.imageUrl());
        entity.setCategory(dto.category());

        if (dto.category() == MenuCategory.DRINKS) {
            entity.setDrinkType(dto.drinkType());
        }

        return entity;
    }
}