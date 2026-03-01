package com.mycompany.backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration test that verifies the Spring application context loads correctly.
 * Requires a running MongoDB instance. Disabled in CI where no MongoDB is available.
 * To run locally: start MongoDB and remove @Disabled.
 */
@SpringBootTest
@Disabled("Requires MongoDB instance – run locally with a real MongoDB connection")
class ErpBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
