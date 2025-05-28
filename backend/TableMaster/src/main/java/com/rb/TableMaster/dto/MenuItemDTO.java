package com.rb.TableMaster.dto;

import com.rb.TableMaster.model.enums.DrinkType;
import com.rb.TableMaster.model.enums.MenuCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record MenuItemDTO(
        @PositiveOrZero
        Long id,

        @NotBlank(message = "O nome do item é obrigatório")
        String name,

        @NotBlank(message = "A descrição é obrigatória")
        String description,

        @NotNull(message = "O preço é obrigatório")
        @Positive(message = "O preço deve ser maior que zero")
        BigDecimal price,

        @NotNull(message = "A imagem é obrigatoria!")
        String imageUrl,

        @NotNull(message = "A categoria é obrigatória")
        MenuCategory category,

        DrinkType drinkType
) {}