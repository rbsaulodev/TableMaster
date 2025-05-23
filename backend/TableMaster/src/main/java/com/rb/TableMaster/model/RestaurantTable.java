package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.TableStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "restaurant_table")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    @Min(1)
    @Max(100)
    private int number;

    @Column
    @Min(1)
    @Max(20)
    private int capacity;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "O status da mesa é obrigatório")
    private TableStatus status;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL)
    private List<Order> orders;
}
