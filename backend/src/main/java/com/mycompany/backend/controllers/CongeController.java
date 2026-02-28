package com.mycompany.backend.controllers;

import com.mycompany.backend.dto.CongeRequestDTO;
import com.mycompany.backend.dto.CongeStatusUpdateDTO;
import com.mycompany.backend.entities.Conge;
import com.mycompany.backend.services.CongeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/conges")
@CrossOrigin(origins = "*")
public class CongeController {

    @Autowired
    private CongeService congeService;

    @PostMapping("/submit")
    public ResponseEntity<Conge> submitConge(
            @RequestParam String employeeId,
            @RequestBody CongeRequestDTO request) {
        Conge conge = congeService.submitConge(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(conge);
    }

    @PutMapping("/{congeId}/status")
    public ResponseEntity<Conge> updateCongeStatus(
            @PathVariable String congeId,
            @RequestParam String managerId,
            @RequestBody CongeStatusUpdateDTO statusUpdate) {
        Conge updatedConge = congeService.updateCongeStatus(congeId, managerId, statusUpdate);
        return ResponseEntity.ok(updatedConge);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Conge>> getAllPendingConges() {
        return ResponseEntity.ok(congeService.getAllPendingConges());
    }

    @GetMapping("/pending-manager")
    public ResponseEntity<List<Conge>> getManagerPendingConges() {
        return ResponseEntity.ok(congeService.getManagerPendingConges());
    }

    @GetMapping
    public ResponseEntity<List<Conge>> getAllConges() {
        return ResponseEntity.ok(congeService.getAllConges());
    }

    @GetMapping("/{congeId}")
    public ResponseEntity<Conge> getCongeById(@PathVariable String congeId) {
        return congeService.getCongeById(congeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{congeId}")
    public ResponseEntity<Void> deleteConge(
            @PathVariable String congeId,
            @RequestParam String employeeId) {
        congeService.deleteConge(congeId, employeeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Conge>> getCongesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(congeService.getCongesByStatus(status));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Conge>> getCongesByEmployeeId(@PathVariable String employeeId) {
        return ResponseEntity.ok(congeService.getCongesByEmployeeId(employeeId));
    }
}