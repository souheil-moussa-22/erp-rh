package com.mycompany.backend.controllers;

import com.mycompany.backend.dto.JobOfferDTO;
import com.mycompany.backend.dto.JobOfferRequest;
import com.mycompany.backend.dto.LinkedInPostResponse;
import com.mycompany.backend.entities.JobOffer;
import com.mycompany.backend.services.JobOfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-offers")
public class JobOfferController {

    @Autowired
    private JobOfferService jobOfferService;

    // GET endpoints - accessibles à tous les utilisateurs authentifiés
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<JobOfferDTO>> getAll() {
        List<JobOfferDTO> jobOffers = jobOfferService.getAll();
        return ResponseEntity.ok(jobOffers);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<JobOfferDTO> getById(@PathVariable String id) {
        return jobOfferService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<JobOfferDTO>> getActive() {
        List<JobOfferDTO> jobOffers = jobOfferService.getActive();
        return ResponseEntity.ok(jobOffers);
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<JobOfferDTO>> search(@RequestParam String keyword) {
        List<JobOfferDTO> results = jobOfferService.search(keyword);
        return ResponseEntity.ok(results);
    }

    // POST/PUT/DELETE endpoints - accessibles uniquement aux HR et HR Managers
    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<JobOfferDTO> create(@RequestBody JobOfferRequest request,
                                              @RequestParam String publisherId) {
        JobOfferDTO created = jobOfferService.create(request, publisherId);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<JobOfferDTO> update(@PathVariable String id,
                                              @RequestBody JobOfferRequest request) {
        try {
            JobOfferDTO updated = jobOfferService.update(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            jobOfferService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<JobOfferDTO> publish(@PathVariable String id) {
        try {
            JobOfferDTO published = jobOfferService.publish(id);
            return ResponseEntity.ok(published);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<JobOfferDTO> close(@PathVariable String id) {
        try {
            JobOfferDTO closed = jobOfferService.close(id);
            return ResponseEntity.ok(closed);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/linkedin/publish")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<?> publishToLinkedIn(@PathVariable String id) {
        try {
            LinkedInPostResponse response = jobOfferService.publishToLinkedIn(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}/linkedin/unpublish")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<?> unpublishFromLinkedIn(@PathVariable String id) {
        try {
            JobOfferDTO result = jobOfferService.unpublishFromLinkedIn(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<JobOfferDTO>> getByStatus(@PathVariable JobOffer.JobOfferStatus status) {
        List<JobOfferDTO> jobOffers = jobOfferService.getByStatus(status);
        return ResponseEntity.ok(jobOffers);
    }
}