package com.rb.TableMaster.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHasher {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPasswordAdmin = "adminpass";
        String encodedPasswordAdmin = encoder.encode(rawPasswordAdmin);
        System.out.println("Admin (username: admin) - Senha em texto puro: " + rawPasswordAdmin + " -> Hash: " + encodedPasswordAdmin);

        String rawPasswordWaiter = "garcompass";
        String encodedPasswordWaiter = encoder.encode(rawPasswordWaiter);
        System.out.println("Garçom (username: garcom1) - Senha em texto puro: " + rawPasswordWaiter + " -> Hash: " + encodedPasswordWaiter);

        String rawPasswordChef = "chefpass";
        String encodedPasswordChef = encoder.encode(rawPasswordChef);
        System.out.println("Cozinheiro (username: chef1) - Senha em texto puro: " + rawPasswordChef + " -> Hash: " + encodedPasswordChef);

        String rawPasswordCustomer = "clientepass";
        String encodedPasswordCustomer = encoder.encode(rawPasswordCustomer);
        System.out.println("Cliente (username: cliente1) - Senha em texto puro: " + rawPasswordCustomer + " -> Hash: " + encodedPasswordCustomer);
    }
}