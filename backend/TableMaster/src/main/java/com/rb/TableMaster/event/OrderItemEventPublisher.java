package com.rb.TableMaster.event;

import com.rb.TableMaster.model.enums.OrderItemStatus;

public interface OrderItemEventPublisher {
    void publishItemStatusChanged(Long itemId, OrderItemStatus newStatus);
    void publishNewOrderItem(Long itemId);
}