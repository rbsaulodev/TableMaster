package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.Notification;
import com.rb.TableMaster.model.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByNotificationTypeAndIsReadFalseOrderByTimestampDesc(String notificationType);
    List<Notification> findByItemIdAndIsReadFalse(Long itemId);
    List<Notification> findByOrderIdAndTitleAndIsReadFalse(Long orderId, String title);
    List<Notification> findByOrderIdAndNotificationTypeAndIsReadFalse(Long orderId, String notificationType);
    List<Notification> findByIsReadFalseOrderByTimestampDesc();
    List<Notification> findByNotificationTypeInAndIsReadFalseOrderByTimestampDesc(List<String> notificationTypes);
    long countByIsReadFalse();
    long countByNotificationTypeAndIsReadFalse(String notificationType);

    List<Notification> findByNotificationTypeAndIsReadFalseOrderByTimestampDesc(NotificationType notificationType); // <-- CORREÇÃO AQUI!
    List<Notification> findByOrderIdAndNotificationTypeAndIsReadFalse(Long orderId, NotificationType notificationType); // <-- CORREÇÃO AQUI!
    List<Notification> findByNotificationType(NotificationType notificationType);
}