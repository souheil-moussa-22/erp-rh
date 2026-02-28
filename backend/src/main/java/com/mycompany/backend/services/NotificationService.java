package com.mycompany.backend.services;

import com.mycompany.backend.entities.Conge;
import com.mycompany.backend.entities.Notification;
import java.util.List;

public interface NotificationService {

    void notifyManagerHrAboutNewLeaveRequest(Conge conge);

    void notifyHrAboutManagerApproval(Conge conge, String managerId, String managerName);

    void notifyEmployeeAboutManagerRejection(Conge conge, String managerId, String managerName);

    void notifyEmployeeAboutHrApproval(Conge conge, String hrId, String hrName);

    void notifyEmployeeAboutHrRejection(Conge conge, String hrId, String hrName);

    List<Notification> getUserNotifications(String userId);

    List<Notification> getUnreadNotifications(String userId);

    long getUnreadCount(String userId);

    void markAsRead(String notificationId);

    void markAllAsRead(String userId);
}
