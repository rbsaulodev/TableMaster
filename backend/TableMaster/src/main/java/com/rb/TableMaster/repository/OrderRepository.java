package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByTable(RestaurantTable table);
    List<Order> findByUser(User user);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    List<Order> findByTableAndStatusIn(RestaurantTable table, List<OrderStatus> statuses);
    Optional<Order> findByUserCpfAndStatus(String userCpf, OrderStatus status);
    List<Order> findByTableAndStatusInAndIdNot(RestaurantTable table, List<OrderStatus> statuses, Long orderIdToExclude);
}

