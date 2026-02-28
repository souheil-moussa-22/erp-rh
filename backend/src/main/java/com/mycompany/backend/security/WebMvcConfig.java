package com.mycompany.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebMvc
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve CSS from multiple locations
        registry.addResourceHandler("/css/**")
                .addResourceLocations(
                        "classpath:/static/css/",
                        "classpath:/public/css/",
                        "classpath:/resources/css/"
                );

        // Serve JS files
        registry.addResourceHandler("/js/**")
                .addResourceLocations(
                        "classpath:/static/js/",
                        "classpath:/public/js/",
                        "classpath:/resources/js/"
                );

        // Serve images
        registry.addResourceHandler("/images/**")
                .addResourceLocations(
                        "classpath:/static/images/",
                        "classpath:/public/images/",
                        "classpath:/resources/images/"
                );

        // Serve webjars (if using Bootstrap or other webjar libraries)
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/")
                .resourceChain(false);
    }
}