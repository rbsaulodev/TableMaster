// backend/TableMaster/src/main/java/com/rb/TableMaster/model/MenuItem.java
package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.MenuCategory;
import com.rb.TableMaster.model.enums.DrinkType;
import com.rb.TableMaster.model.enums.Difficulty; // ADICIONE ESTE IMPORT
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(length = 200, nullable = false)
    private String description;

    private BigDecimal price;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MenuCategory category;

    @Enumerated(EnumType.STRING)
    private DrinkType drinkType;

    @Column(nullable = false)
    private boolean available = true;

    // NOVOS CAMPOS PARA O COZINHEIRO
    private Integer preparationTime; // Tempo de preparo em minutos
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty; // Dificuldade: EASY, MEDIUM, DIFFICULT
}