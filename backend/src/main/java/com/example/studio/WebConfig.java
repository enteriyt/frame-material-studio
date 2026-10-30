package com.example.studio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final Storage storage;
    private final String origin;
    public WebConfig(Storage storage, @Value("${studio.allowed-origin}") String origin) { this.storage = storage; this.origin = origin; }
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/**").addResourceLocations(storage.root().toUri().toString());
        registry.addResourceHandler("/demo/**").addResourceLocations("classpath:/static/demo/");
    }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins(origin).allowedMethods("GET", "POST", "OPTIONS").allowedHeaders("Content-Type", "X-User-Token");
    }
}
