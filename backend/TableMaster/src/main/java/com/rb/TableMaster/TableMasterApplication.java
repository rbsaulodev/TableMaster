package com.rb.TableMaster;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TableMasterApplication {
	public static void main(String[] args) {
		SpringApplication.run(TableMasterApplication.class, args);
	}
}