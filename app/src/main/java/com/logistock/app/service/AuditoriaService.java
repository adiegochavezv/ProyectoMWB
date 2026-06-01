package com.logistock.app.service;

import com.logistock.app.model.Auditoria;
import com.logistock.app.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditoriaService {
    @Autowired
    private AuditoriaRepository auditoriaRepository;

    public void registrarAccion(String accion, String detalle) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Auditoria audit = new Auditoria(email, accion, detalle);
        auditoriaRepository.save(audit);
    }
}