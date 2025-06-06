package com.rb.TableMaster.event;

import com.rb.TableMaster.model.enums.PaymentMethod;

public interface OrderEventPublisher {
    void publishNewOrder(Long tableId, Long orderId);
    void publishAccountRequest(Long tableId, Long orderId, PaymentMethod requestedPaymentMethod);
}