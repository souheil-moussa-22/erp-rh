package com.mycompany.backend.event;

import com.mycompany.backend.entities.Employee;
import lombok.Getter;
import lombok.Setter;
import org.springframework.context.ApplicationEvent;

@Getter
@Setter
public class RegistrationCompleteEvent extends ApplicationEvent {
    private Employee employee;
    private String applicationUrl;

    public RegistrationCompleteEvent(Employee employee, String applicationUrl) {
        super(employee);
        this.employee = employee;
        this.applicationUrl = applicationUrl;
    }

    // Ajoutez explicitement le getter pour employee
    public Employee getEmployee() {
        return employee;
    }

    public String getApplicationUrl() {
        return applicationUrl;
    }
}