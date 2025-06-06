package com.rb.TableMaster.dto.mapper;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.enums.MenuCategory;
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
                entity.getDrinkType(),
                entity.isAvailable(), // Certifique-se de que 'available' está sendo mapeado
                entity.getPreparationTime(), // <-- NOVO: Mapeia preparationTime
                entity.getDifficulty() // <-- NOVO: Mapeia difficulty
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
        entity.setAvailable(dto.available()); // Certifique-se de que 'available' está sendo mapeado

        if (dto.category() == MenuCategory.DRINKS) {
            entity.setDrinkType(dto.drinkType());
        } else {
            entity.setDrinkType(null); // Garante que drinkType é null se não for bebida
        }

        // NOVOS CAMPOS: Define preparationTime e difficulty na entidade
        entity.setPreparationTime(dto.preparationTime()); // <-- NOVO
        entity.setDifficulty(dto.difficulty()); // <-- NOVO

        return entity;
    }
}