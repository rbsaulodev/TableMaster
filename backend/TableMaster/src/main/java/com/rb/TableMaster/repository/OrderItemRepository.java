package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
