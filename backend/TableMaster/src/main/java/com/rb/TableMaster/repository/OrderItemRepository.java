package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.OrderItem;
import com.rb.TableMaster.model.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByStatus(OrderItemStatus status);
    List<OrderItem> findByStatusOrderByCreatedAtAsc(OrderItemStatus status);
    Long countByStatus(OrderItemStatus status);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.table.id = :tableId AND oi.status NOT IN ('DELIVERED', 'CANCELLED')")
    List<OrderItem> findActiveItemsByTable(@Param("tableId") Long tableId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.status = 'READY' ORDER BY oi.updatedAt ASC")
    List<OrderItem> findReadyItemsOrderByTime();

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.status IN ('PENDING', 'PREPARING')")
    boolean hasActiveItemsInOrder(@Param("orderId") Long orderId);
}