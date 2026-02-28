package com.mycompany.backend.services.Impl;

import com.mycompany.backend.dto.EmployeeGetDTO;
import com.mycompany.backend.entities.Conge;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Notification;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.repositories.NotificationRepository;
import com.mycompany.backend.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeServiceImpl employeeService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyManagerHrAboutNewLeaveRequest(Conge conge) {
        EmployeeGetDTO managerHr = employeeService.getSingleRhManager();
        if (managerHr == null) {
            throw new RuntimeException("Manager HR not found");
        }

        Employee employee = employeeRepository.findById(conge.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Notification notification = new Notification(
                managerHr.getId(),
                conge.getEmployeeId(),
                employee.getUsername(),
                "LEAVE_REQUEST",
                "New Leave Request",
                String.format("%s has submitted a %s leave request from %s to %s",
                        employee.getUsername(), conge.getType(), conge.getStartDate(), conge.getEndDate()),
                conge.getId()
        );

        Notification savedNotification = notificationRepository.save(notification);

        // Send real-time notification via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + managerHr.getId(),
                savedNotification
        );
    }

    public void notifyHrAboutManagerApproval(Conge conge, String managerId, String managerName) {
        EmployeeGetDTO hr = employeeService.getSingleRh();
        if (hr == null) {
            throw new RuntimeException("HR not found");
        }

        Employee employee = employeeRepository.findById(conge.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Notification notification = new Notification(
                hr.getId(),
                managerId,
                managerName,
                "LEAVE_APPROVED_BY_MANAGER",
                "Leave Request Approved by Manager",
                String.format("Manager has approved %s's %s leave request from %s to %s",
                        employee.getUsername(), conge.getType(), conge.getStartDate(), conge.getEndDate()),
                conge.getId()
        );

        Notification savedNotification = notificationRepository.save(notification);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + hr.getId(),
                savedNotification
        );
    }

    public void notifyEmployeeAboutManagerRejection(Conge conge, String managerId, String managerName) {
        Notification notification = new Notification(
                conge.getEmployeeId(),
                managerId,
                managerName,
                "LEAVE_REJECTED_BY_MANAGER",
                "Leave Request Rejected",
                String.format("Your %s leave request from %s to %s has been rejected by Manager. Reason: %s",
                        conge.getType(), conge.getStartDate(), conge.getEndDate(),
                        conge.getManagerRejectionReason()),
                conge.getId()
        );

        Notification savedNotification = notificationRepository.save(notification);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + conge.getEmployeeId(),
                savedNotification
        );
    }

    public void notifyEmployeeAboutHrApproval(Conge conge, String hrId, String hrName) {
        Notification notification = new Notification(
                conge.getEmployeeId(),
                hrId,
                hrName,
                "LEAVE_APPROVED_BY_HR",
                "Leave Request Approved",
                String.format("Your %s leave request from %s to %s has been fully approved by HR",
                        conge.getType(), conge.getStartDate(), conge.getEndDate()),
                conge.getId()
        );

        Notification savedNotification = notificationRepository.save(notification);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + conge.getEmployeeId(),
                savedNotification
        );
    }

    public void notifyEmployeeAboutHrRejection(Conge conge, String hrId, String hrName) {
        Notification notification = new Notification(
                conge.getEmployeeId(),
                hrId,
                hrName,
                "LEAVE_REJECTED_BY_HR",
                "Leave Request Rejected",
                String.format("Your %s leave request from %s to %s has been rejected by HR. Reason: %s",
                        conge.getType(), conge.getStartDate(), conge.getEndDate(),
                        conge.getRhRejectionReason()),
                conge.getId()
        );

        Notification savedNotification = notificationRepository.save(notification);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + conge.getEmployeeId(),
                savedNotification
        );
    }

    // Rest of the methods remain the same
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByRecipientIdAndReadOrderByCreatedAtDesc(userId, false);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndRead(userId, false);
    }

    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdAndReadOrderByCreatedAtDesc(userId, false);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}