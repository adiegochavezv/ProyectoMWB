package com.logistock.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private String usuarioEmail;
    private String accion;
    private String detalle;

    @PrePersist
    protected void onCreate() {
        fecha = LocalDateTime.now();
    }

    // Constructor vacío y con parámetros
    public Auditoria() {}
    public Auditoria(String usuarioEmail, String accion, String detalle) {
        this.usuarioEmail = usuarioEmail;
        this.accion = accion;
        this.detalle = detalle;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public LocalDateTime getFecha() { return fecha; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public String getAccion() { return accion; }
    public String getDetalle() { return detalle; }
}