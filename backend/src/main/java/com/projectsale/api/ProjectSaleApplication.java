package com.projectsale.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ProjectSaleApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProjectSaleApplication.class, args);
    }
}
