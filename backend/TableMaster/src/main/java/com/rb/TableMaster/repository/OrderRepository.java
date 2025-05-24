package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    List<Order> findByTable(RestaurantTable table);

    List<Order> findByUserAndTable(User user, RestaurantTable table);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Order> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    List<Order> findByStatus(OrderStatus status);
}
