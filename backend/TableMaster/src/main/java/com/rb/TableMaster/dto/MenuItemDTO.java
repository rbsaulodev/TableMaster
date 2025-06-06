// backend/TableMaster/src/main/java/com/rb/TableMaster/dto/MenuItemDTO.java
package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.MenuCategory;
import com.rb.TableMaster.model.enums.DrinkType;
import com.rb.TableMaster.model.enums.Difficulty; // ADICIONE ESTE IMPORT
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record MenuItemDTO(
       @PositiveOrZero
        Long id,

        @NotBlank(message = "O nome é obrigatório.")
        String name,

        @NotBlank(message = "A descrição é obrigatória.")
        String description,

        @NotNull(message = "O preço é obrigatório.")
        @Positive(message = "O preço deve ser positivo.")
        BigDecimal price,
        String imageUrl,

        @NotNull(message = "A categoria é obrigatória.")
        MenuCategory category,

        DrinkType drinkType,

        boolean available,

        @NotNull(message = "O tempo de preparo é obrigatório.")
        @Positive(message = "O tempo de preparo deve ser positivo.")
        Integer preparationTime,

        @NotNull(message = "A dificuldade é obrigatória.")
        Difficulty difficulty
) {}