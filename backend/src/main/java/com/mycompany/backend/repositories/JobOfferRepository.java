package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.JobOffer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobOfferRepository extends MongoRepository<JobOffer, String> {

    List<JobOffer> findByStatus(JobOffer.JobOfferStatus status);
    List<JobOffer> findByDepartment(String department);
    List<JobOffer> findByLocation(String location);
    List<JobOffer> findByStatusAndIsActive(JobOffer.JobOfferStatus status, Boolean isActive);

    @Query("{ 'isActive': true, 'status': { $ne: 'ARCHIVED' } }")
    List<JobOffer> findActiveJobOffers();

    @Query("{ '$and': [ { 'isActive': true }, { '$or': [ { 'title': { '$regex': ?0, '$options': 'i' } }, { 'description': { '$regex': ?0, '$options': 'i' } }, { 'tags': { '$regex': ?0, '$options': 'i' } } ] } ] }")
    List<JobOffer> searchByKeyword(String keyword);

    @Query("{ 'closingDate': { $lt: ?0 }, 'status': { $ne: 'EXPIRED' }, 'isActive': true }")
    List<JobOffer> findExpiredJobOffers(LocalDate currentDate);

    List<JobOffer> findByContractTypeAndIsActive(String contractType, Boolean isActive);
    long countByStatus(JobOffer.JobOfferStatus status);
    List<JobOffer> findByIsActiveOrderByCreatedAtDesc(Boolean isActive, org.springframework.data.domain.Pageable pageable);

    @Query("{ 'createdAt': { '$gte': ?0 }, 'isActive': true }")
    List<JobOffer> findRecentJobOffers(LocalDateTime date);

    boolean existsByTitleAndIsActive(String title, Boolean isActive);
}