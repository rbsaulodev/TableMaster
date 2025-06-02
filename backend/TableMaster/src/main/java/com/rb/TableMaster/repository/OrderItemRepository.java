package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByStatus(OrderItemStatus status);
    List<OrderItem> findByOrder(Order order);
    Optional<OrderItem> findByOrderAndMenuItem(Order order, com.rb.TableMaster.model.MenuItem menuItem);
}
