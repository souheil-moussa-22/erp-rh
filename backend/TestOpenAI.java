package com.mycompany.backend;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestOpenAI {
    public static void main(String[] args) throws Exception {
        // Votre clé actuelle
        String apiKey = "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";

        System.out.println("🔑 Testing OpenAI API Key...");
        System.out.println("Key starts with: " + apiKey.substring(0, 20) + "...");

        HttpClient client = HttpClient.newHttpClient();

        // Test 1: Vérifier l'accès
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/models"))
                .header("Authorization", "Bearer " + apiKey)
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Response: " + response.body());

        if (response.statusCode() == 200) {
            System.out.println("✅ SUCCESS! Your API key is valid.");
        } else {
            System.out.println("❌ ERROR! Your API key is invalid or expired.");
            System.out.println("Please get a NEW key from: https://platform.openai.com/api-keys");
        }
    }
}