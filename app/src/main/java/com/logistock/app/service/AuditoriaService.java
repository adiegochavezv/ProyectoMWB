package com.logistock.app.service;

import com.logistock.app.model.Auditoria;
import com.logistock.app.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditoriaService {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    public void registrarAccion(String accion, String detalle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        String usuario = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) 
                         ? auth.getName() 
                         : "Sistema";

        Auditoria auditoria = new Auditoria();
        auditoria.setFecha(LocalDateTime.now());
        auditoria.setUsuarioEmail(usuario);
        auditoria.setAccion(accion);
        auditoria.setDetalle(detalle);
        
        auditoriaRepository.save(auditoria);
    }
}