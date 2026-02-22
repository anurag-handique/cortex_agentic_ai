package com.cortex.assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
		org.springframework.cloud.function.context.config.ContextFunctionCatalogAutoConfiguration.class
})
@EnableAsync
@EnableScheduling
public class CortexAiEngine {

	public static void main(String[] args) {
		SpringApplication.run(CortexAiEngine.class, args);
	}
}
