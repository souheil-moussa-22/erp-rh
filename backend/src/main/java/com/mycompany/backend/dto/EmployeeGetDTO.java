package com.mycompany.backend.dto;

import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Role;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeGetDTO {
    private String id;
    private String username;
    private String email;
    private String phone;
    private String position;
    private String status;
    private List<String> roleNames;
    private String department;
    private Integer age;
    private String performance;
    private Integer satisfaction;
    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPerformance() {
        return performance;
    }

    public void setPerformance(String performance) {
        this.performance = performance;
    }

    public Integer getSatisfaction() {
        return satisfaction;
    }

    public void setSatisfaction(Integer satisfaction) {
        this.satisfaction = satisfaction;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getRoleNames() {
        return roleNames;
    }

    public void setRoleNames(List<String> roleNames) {
        this.roleNames = roleNames;
    }

    public static EmployeeGetDTO EmployeeToEmployeeDto(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeGetDTO employeeGetDTO = new EmployeeGetDTO();
        employeeGetDTO.setId(employee.getId());
        employeeGetDTO.setUsername(employee.getUsername());
        employeeGetDTO.setEmail(employee.getEmail());
        employeeGetDTO.setPhone(employee.getPhone());
        employeeGetDTO.setPosition(employee.getPosition());
        employeeGetDTO.setStatus(employee.getStatus());

        List<String> names = new ArrayList<>();
        Set<Role> roles = employee.getRoles();
        if (roles != null) {
            for (Role role : roles) {
                if (role != null && role.getName() != null) {
                    names.add(role.getName().name());
                }
            }
        }
        employeeGetDTO.setRoleNames(names);
        return employeeGetDTO;
    }

    public static List<EmployeeGetDTO> EmployeesToEmployeeDtos(List<Employee> employees) {
        List<EmployeeGetDTO> employeeDtos = new ArrayList<>();
        if (employees != null) {
            for (Employee employee : employees) {
                EmployeeGetDTO dto = EmployeeToEmployeeDto(employee);
                if (dto != null) {
                    employeeDtos.add(dto);
                }
            }
        }
        return employeeDtos;
    }
}