package com.stockapp.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String resource, String id) {
        super(HttpStatus.NOT_FOUND, resource + " not found with id: " + id);
    }
}
