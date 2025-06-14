package com.rb.TableMaster.exception;

public class RecordNotFoundException extends RuntimeException {

    public RecordNotFoundException(String message) {
        super(message);
    }

    public RecordNotFoundException(Long id, Class<?> entityClass) {
        super("Registro com ID " + id + " não encontrado para a entidade: " + entityClass.getSimpleName());
    }


    public RecordNotFoundException(String cpf, Class<?> entityClass){
        super("Registro com CPF " + cpf + " não encontrado para a entidade: " + entityClass.getSimpleName());
    }
}