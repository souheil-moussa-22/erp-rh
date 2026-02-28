package com.mycompany.backend.dto;

public class LeaveBalanceDTO {
    private String leaveType;
    private String leaveTypeLabel;
    private double totalDays;
    private double usedDays;
    private double remainingDays;

    public LeaveBalanceDTO() {}

    public LeaveBalanceDTO(String leaveType, String leaveTypeLabel, double totalDays, double usedDays, double remainingDays) {
        this.leaveType = leaveType;
        this.leaveTypeLabel = leaveTypeLabel;
        this.totalDays = totalDays;
        this.usedDays = usedDays;
        this.remainingDays = remainingDays;
    }

    // Getters et Setters
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }

    public String getLeaveTypeLabel() { return leaveTypeLabel; }
    public void setLeaveTypeLabel(String leaveTypeLabel) { this.leaveTypeLabel = leaveTypeLabel; }

    public double getTotalDays() { return totalDays; }
    public void setTotalDays(double totalDays) { this.totalDays = totalDays; }

    public double getUsedDays() { return usedDays; }
    public void setUsedDays(double usedDays) { this.usedDays = usedDays; }

    public double getRemainingDays() { return remainingDays; }
    public void setRemainingDays(double remainingDays) { this.remainingDays = remainingDays; }

    @Override
    public String toString() {
        return "LeaveBalanceDTO{" +
                "leaveType='" + leaveType + '\'' +
                ", leaveTypeLabel='" + leaveTypeLabel + '\'' +
                ", totalDays=" + totalDays +
                ", usedDays=" + usedDays +
                ", remainingDays=" + remainingDays +
                '}';
    }
}