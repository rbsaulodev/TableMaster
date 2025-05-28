package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.MenuCategory;
import com.rb.TableMaster.model.enums.DrinkType;
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
}