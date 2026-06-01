/* =========================================================================
   SISTEMA LOGISTOCK - SCRIPT PRINCIPAL (FRONTEND LOGIC)
   Conserva 100% de la lógica original, restaura la API, Gráficas y Movimientos.
   ========================================================================= */

// 1. VARIABLES GLOBALES Y ESTADO
let stockChartInstance = null;
let categoryChartInstance = null;
let exchangeRateData = { pen: 0, eur: 0 };
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// 2. INICIALIZACIÓN PRINCIPAL (DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
    console.log("LogiStock: Inicializando módulos base...");
    
    initDarkMode();
    initExchangeRateAPI();
    initCharts();
    initTooltips();
    initTableFilters();
    initAlerts();
    bindProductEvents();
});

// 3. MÓDULO: MODO OSCURO (DARK MODE)
// Se mantiene la persistencia en localStorage solicitada.
function initDarkMode() {
    const btnDarkMode = document.getElementById('btn-dark-mode');
    const iconoTema = document.getElementById('iconoTema');
    
    // Validar preferencia guardada previamente en el navegador
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (iconoTema) {
            iconoTema.classList.remove('bi-moon-stars-fill');
            iconoTema.classList.add('bi-sun-fill');
        }
    }

    // Escucha del botón
    if (btnDarkMode) {
        btnDarkMode.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            const currentlyDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', currentlyDark);
            
            // Animación del Icono
            if (iconoTema) {
                if (currentlyDark) {
                    iconoTema.classList.remove('bi-moon-stars-fill');
                    iconoTema.classList.add('bi-sun-fill');
                } else {
                    iconoTema.classList.remove('bi-sun-fill');
                    iconoTema.classList.add('bi-moon-stars-fill');
                }
            }
            // Actualizar paleta de gráficos dinámicamente si existen
            updateChartsTheme(currentlyDark);
        });
    }
}

// 4. MÓDULO: API DE CAMBIO DE MONEDA (RECUPERADO)
function initExchangeRateAPI() {
    const apiContainer = document.getElementById('api-moneda-container');
    if (!apiContainer) return; // Validación de existencia en el DOM

    apiContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-2">
            <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span>Cargando tipo de cambio internacional...</span>
        </div>`;

    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            exchangeRateData.pen = data.rates.PEN.toFixed(2);
            exchangeRateData.eur = data.rates.EUR.toFixed(2);
            
            apiContainer.innerHTML = `
                <div class="alert alert-info shadow-sm py-2 m-0 d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-currency-exchange me-2"></i> 
                        <strong>Cotización Actual USD:</strong> S/ ${exchangeRateData.pen} (PEN) | € ${exchangeRateData.eur} (EUR)
                    </div>
                    <small class="text-muted"><i class="bi bi-clock"></i> Actualizado hoy</small>
                </div>`;
        })
        .catch(error => {
            console.error("Error obteniendo tipo de cambio:", error);
            apiContainer.innerHTML = `
                <div class="alert alert-warning shadow-sm py-2 m-0 text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i> 
                    Servicio de cotización de moneda temporalmente no disponible.
                </div>`;
        });
}

// 5. MÓDULO: GRÁFICAS (CHART.JS RECUPERADO)
function initCharts() {
    const stockCanvas = document.getElementById('stockChart');
    const isDark = document.body.classList.contains('dark-mode');

    // Chart Principal de Stock y Movimientos
    if (stockCanvas && typeof Chart !== 'undefined') {
        const ctxStock = stockCanvas.getContext('2d');
        stockChartInstance = new Chart(ctxStock, {
            type: 'bar',
            data: {
                labels: ['Ingresos de Stock', 'Ventas Realizadas', 'Mermas', 'Productos Defectuosos'],
                datasets: [{
                    label: 'Volumen de Operaciones (Mes Actual)',
                    // Estos datos se conectarán luego vía JSON desde Thymeleaf, mock por ahora para UX:
                    data: [150, 85, 12, 3], 
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.8)',  // Success
                        'rgba(13, 110, 253, 0.8)', // Primary
                        'rgba(255, 193, 7, 0.8)',  // Warning
                        'rgba(220, 53, 69, 0.8)'   // Danger
                    ],
                    borderColor: ['#198754', '#0d6efd', '#ffc107', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: isDark ? '#333333' : '#e9ecef' },
                        ticks: { color: isDark ? '#e0e0e0' : '#212529' }
                    },
                    x: {
                        grid: { color: isDark ? '#333333' : '#e9ecef' },
                        ticks: { color: isDark ? '#e0e0e0' : '#212529' }
                    }
                },
                plugins: {
                    legend: { labels: { color: isDark ? '#e0e0e0' : '#212529' } }
                }
            }
        });
    }
}

function updateChartsTheme(isDark) {
    const gridColor = isDark ? '#333333' : '#e9ecef';
    const textColor = isDark ? '#e0e0e0' : '#212529';

    if (stockChartInstance) {
        stockChartInstance.options.scales.x.grid.color = gridColor;
        stockChartInstance.options.scales.x.ticks.color = textColor;
        stockChartInstance.options.scales.y.grid.color = gridColor;
        stockChartInstance.options.scales.y.ticks.color = textColor;
        stockChartInstance.options.plugins.legend.labels.color = textColor;
        stockChartInstance.update();
    }
}

// 6. MÓDULO: GESTIÓN DE PRODUCTOS, ALMACÉN Y MOVIMIENTOS
function bindProductEvents() {
    // 6.1 Confirmación de eliminación mediante SweetAlert2
    const deleteButtons = document.querySelectorAll('.btn-delete-product');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const form = this.closest('form');
            const productName = this.getAttribute('data-name') || 'este producto';
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '¿Confirmar eliminación?',
                    text: `Estás a punto de eliminar ${productName}. Esta acción registrará un evento de auditoría irrevocable.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        form.submit();
                    }
                });
            } else {
                // Fallback si SweetAlert falla en cargar
                if(confirm(`¿Eliminar ${productName}?`)) {
                    form.submit();
                }
            }
        });
    });

    // 6.2 Validación robusta del Formulario de Movimientos (Venta, Merma, etc)
    const formsMovimiento = document.querySelectorAll('.form-movimiento');
    formsMovimiento.forEach(form => {
        form.addEventListener('submit', function(e) {
            const select = this.querySelector('select[name="tipoMovimiento"]');
            const inputCantidad = this.querySelector('input[name="cantidad"]');
            
            if (!select.value || select.value === "") {
                e.preventDefault();
                alert('Por favor, seleccione el tipo de movimiento de almacén.');
                select.focus();
                return;
            }
            if (inputCantidad.value <= 0) {
                e.preventDefault();
                alert('La cantidad de movimiento debe ser estrictamente mayor a cero.');
                inputCantidad.focus();
                return;
            }
        });
    });
}

// 7. MÓDULO: NAVEGACIÓN Y VISTAS (Restauradas)
function verDashboard() {
    window.location.href = '/dashboard';
}

function verInventario() {
    window.location.href = '/productos';
}

function verHistorial() {
    window.location.href = '/auditoria';
}

// 8. UTILERÍAS GLOBALES COMPLEMENTARIAS
function initTooltips() {
    // Inicialización nativa de Bootstrap Tooltips si existen
    if(typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

function initTableFilters() {
    // Restaurada la función de búsqueda dinámica de productos en el almacén
    const searchInput = document.getElementById('searchProduct');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', function() {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll('.table-almacen tbody tr');
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}

function initAlerts() {
    // Auto-ocultar alertas de Spring Boot tras acciones CRUD
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert-auto-dismissible');
        alerts.forEach(alert => {
            if(typeof bootstrap !== 'undefined') {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            } else {
                alert.style.display = 'none';
            }
        });
    }, 5000);
}
