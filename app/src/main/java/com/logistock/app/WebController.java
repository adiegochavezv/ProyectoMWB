package com.logistock.app;

import com.logistock.app.model.Producto;
import com.logistock.app.repository.AuditoriaRepository;
import com.logistock.app.repository.CategoriaRepository;
import com.logistock.app.repository.ProductoRepository;
import com.logistock.app.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;

@Controller
public class WebController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private AuditoriaRepository auditoriaRepository;
    @Autowired private AuditoriaService auditoriaService;

    // EL INDEX AHORA SE MUESTRA DIRECTAMENTE
    @GetMapping({"/", "/index"})
    public String index() { 
        return "index"; 
    }

    // GESTIÓN DEL LOGIN SOLO POR GET
    @GetMapping("/login")
    public String login() { 
        return "login"; 
    }

    // RUTAS PROTEGIDAS (Spring Security las bloqueará si no hay sesión)
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        model.addAttribute("auditorias", auditoriaRepository.findAllByOrderByFechaDesc());
        return "app/dashboard";
    }

    @PostMapping("/productos/guardar")
    public String guardarProducto(@ModelAttribute Producto producto) {
        boolean esNuevo = (producto.getId() == null);
        productoRepository.save(Objects.requireNonNull(producto));
        String accion = esNuevo ? "CREAR_PRODUCTO" : "EDITAR_PRODUCTO";
        auditoriaService.registrarAccion(accion, "Producto procesado: " + producto.getNombre());
        return "redirect:/dashboard";
    }

    @GetMapping("/productos/eliminar/{id}")
    public String eliminarProducto(@PathVariable Long id) {
        if (id != null) {
            Producto p = productoRepository.findById(id).orElse(null);
            if (p != null) {
                productoRepository.deleteById(id);
                auditoriaService.registrarAccion("ELIMINAR_PRODUCTO", "Eliminado: " + p.getNombre());
            }
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/stock-critico")
    public String stockCritico(Model model) {
        model.addAttribute("criticos", productoRepository.findByCantidadLessThan(5));
        auditoriaService.registrarAccion("VISTA_CRITICA", "Acceso a panel crítico");
        return "app/stock_critico";
    }
}