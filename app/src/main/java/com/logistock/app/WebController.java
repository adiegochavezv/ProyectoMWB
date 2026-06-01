package com.logistock.app;

import com.logistock.app.model.Producto;
import com.logistock.app.repository.AuditoriaRepository;
import com.logistock.app.repository.CategoriaRepository;
import com.logistock.app.repository.ProductoRepository;
import com.logistock.app.service.AuditoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class WebController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private AuditoriaRepository auditoriaRepository;
    @Autowired private AuditoriaService auditoriaService;

    @GetMapping({"/", "/index"})
    public String index() { 
        return "index"; 
    }

    @GetMapping("/login")
    public String login() { 
        return "login"; 
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        model.addAttribute("criticos", productoRepository.findByCantidadLessThan(5)); // Para KPI de tarjetas
        return "app/dashboard";
    }

    // NUEVA MEJORA 1: BOTÓN CATÁLOGO (Solo lectura)
    @GetMapping("/catalogo")
    public String catalogo(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        auditoriaService.registrarAccion("VISTA_CATALOGO", "Consulta general del catálogo de productos");
        return "app/catalogo"; 
    }

    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        return "app/productos";
    }

    @GetMapping("/auditoria")
    public String auditoria(Model model) {
        model.addAttribute("auditorias", auditoriaRepository.findAllByOrderByFechaDesc());
        auditoriaService.registrarAccion("VISTA_AUDITORIA", "Revisión del historial del sistema");
        return "app/auditoria";
    }

    @PostMapping("/productos/guardar")
    public String guardarProducto(@Valid @ModelAttribute Producto producto, BindingResult result, RedirectAttributes redirectAttrs) {
        if (result.hasErrors()) {
            redirectAttrs.addFlashAttribute("error", "Datos de producto inválidos.");
            return "redirect:/productos";
        }
        boolean esNuevo = (producto.getId() == null);
        productoRepository.save(producto);
        
        String accion = esNuevo ? "CREAR_PRODUCTO" : "EDITAR_PRODUCTO";
        auditoriaService.registrarAccion(accion, "Producto procesado: " + producto.getNombre());
        redirectAttrs.addFlashAttribute("exito", "Producto registrado correctamente en el sistema.");
        return "redirect:/productos";
    }

    // MEJORA 6: VALIDACIÓN CRÍTICA DE STOCK
    @PostMapping("/productos/{id}/movimiento")
    public String registrarMovimiento(@PathVariable Long id, 
                                      @RequestParam String tipoMovimiento, 
                                      @RequestParam int cantidad,
                                      RedirectAttributes redirectAttrs) {
        Long safeId = java.util.Objects.requireNonNull(id);
        
        productoRepository.findById(safeId).ifPresent(p -> {
            int stockAnterior = p.getCantidad();
            
            if ("INGRESO".equals(tipoMovimiento)) {
                p.setCantidad(p.getCantidad() + cantidad);
            } else {
                // REGLA DE NEGOCIO: Bloqueo absoluto de stock negativo (Backend Validation)
                if (cantidad > p.getCantidad()) {
                    redirectAttrs.addFlashAttribute("errorStock", 
                        "Stock insuficiente para realizar la operación. Solicitó sacar " + cantidad + " pero solo hay " + p.getCantidad() + " unidades de " + p.getNombre() + ".");
                    return; // Aborta la operación y la base de datos no se toca
                }
                p.setCantidad(p.getCantidad() - cantidad); 
            }
            
            productoRepository.save(p);
            String detalle = String.format("Operación: %s | Artículo: %s | Transición: %d -> %d", 
                                           tipoMovimiento, p.getNombre(), stockAnterior, p.getCantidad());
            auditoriaService.registrarAccion("MOVIMIENTO_INVENTARIO", detalle);
            redirectAttrs.addFlashAttribute("exito", "Ajuste de inventario aplicado con éxito.");
        });
        
        return "redirect:/productos";
    }

    @PostMapping("/productos/eliminar/{id}")
    public String eliminarProducto(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        Long safeId = java.util.Objects.requireNonNull(id);
        productoRepository.findById(safeId).ifPresent(p -> {
            productoRepository.deleteById(safeId);
            auditoriaService.registrarAccion("ELIMINAR_PRODUCTO", "Artículo eliminado de forma permanente: " + p.getNombre());
            redirectAttrs.addFlashAttribute("exito", "Producto eliminado de la base de datos.");
        });
        return "redirect:/productos";
    }

    @GetMapping("/stock-critico")
    public String stockCritico(Model model) {
        model.addAttribute("criticos", productoRepository.findByCantidadLessThan(5));
        auditoriaService.registrarAccion("VISTA_CRITICA", "Revisión de panel de urgencias de stock");
        return "app/stock_critico";
    }
}