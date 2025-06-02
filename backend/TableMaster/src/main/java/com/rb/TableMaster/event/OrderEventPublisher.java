package com.rb.TableMaster.event;

public interface OrderEventPublisher {
    void publishNewOrder(Long tableId, Long orderId);
    void publishAccountRequest(Long tableId, Long orderId);
}