package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.TableStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "restaurant_table")
public class RestaurantTable  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private int number;

    @Enumerated(EnumType.STRING)
    private TableStatus status;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL)
    private List<Order> orders;
}
