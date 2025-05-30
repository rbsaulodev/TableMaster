package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByStatus(TableStatus status);
    Optional<RestaurantTable> findByNumber(Integer number);
}
