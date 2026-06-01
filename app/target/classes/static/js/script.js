/* =========================================================================
   SISTEMA LOGISTOCK - LÓGICA FRONTEND COMPLETA
   Se incluyen validaciones HTML5 duales (Front/Back) para Stock Negativo.
   ========================================================================= */

let stockChartInstance = null;
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    initExchangeRateAPI();
    initCharts();
    initTooltips();
    initAlerts();
    bindProductEvents();
});

/* --- MÓDULO 1: MODO OSCURO (PERSISTENCIA TOTAL) --- */
function initDarkMode() {
    const btnDarkMode = document.getElementById('btn-dark-mode');
    const iconoTema = document.getElementById('iconoTema');
    const isDark = localStorage.getItem('darkMode') === 'true';

    // Estado inicial
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (iconoTema) {
            iconoTema.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
        }
    }

    // Toggle en Clic
    if (btnDarkMode) {
        btnDarkMode.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            const currentlyDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', currentlyDark);
            
            if (iconoTema) {
                if (currentlyDark) {
                    iconoTema.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
                } else {
                    iconoTema.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
                }
            }
            updateChartsTheme(currentlyDark);
        });
    }
}

/* --- MÓDULO 2: LLAMADA A API DE COTIZACIÓN (REST FULL) --- */
function initExchangeRateAPI() {
    const apiContainer = document.getElementById('api-moneda-container');
    if (!apiContainer) return;

    apiContainer.innerHTML = `
        <div class="d-flex justify-content-start align-items-center text-muted small p-1">
            <div class="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
            <span>Conectando con servidor de divisas global...</span>
        </div>`;

    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(data => {
            const pen = data.rates.PEN.toFixed(2);
            const eur = data.rates.EUR.toFixed(2);
            
            apiContainer.innerHTML = `
                <div class="alert shadow-sm border-0 bg-white border-start border-info border-4 py-3 m-0 d-flex justify-content-between align-items-center rounded-3">
                    <div class="text-dark fw-medium">
                        <i class="bi bi-currency-exchange text-info fs-5 me-2"></i> 
                        <strong class="text-uppercase tracking-wider small">Cotización Banco Central:</strong> 
                        <span class="ms-2 fs-6">$1 USD = <span class="fw-bold text-success">S/ ${pen} PEN</span> | € ${eur} EUR</span>
                    </div>
                    <span class="badge bg-light text-muted border px-3 py-2"><i class="bi bi-broadcast me-1 text-success"></i> API En Línea</span>
                </div>`;
        })
        .catch(error => {
            console.error("Error API:", error);
            apiContainer.innerHTML = `
                <div class="alert alert-secondary py-2 m-0 text-muted small border-0">
                    <i class="bi bi-cloud-slash-fill me-2"></i> Servicio de cotización temporalmente offline.
                </div>`;
        });
}

/* --- MÓDULO 3: GRÁFICAS DE CHART.JS --- */
function initCharts() {
    const stockCanvas = document.getElementById('stockChart');
    const isDark = document.body.classList.contains('dark-mode');

    if (stockCanvas && typeof Chart !== 'undefined') {
        const ctxStock = stockCanvas.getContext('2d');
        stockChartInstance = new Chart(ctxStock, {
            type: 'bar',
            data: {
                labels: ['Ingresos (Compras)', 'Salidas (Ventas)', 'Mermas y Residuos', 'Garantías (Defectuosos)'],
                datasets: [{
                    label: 'Registros Operativos (Últimos 30 días)',
                    data: [250, 185, 14, 5], // Base de visualización
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.85)',  // Verde
                        'rgba(13, 110, 253, 0.85)', // Azul
                        'rgba(255, 193, 7, 0.85)',  // Amarillo
                        'rgba(220, 53, 69, 0.85)'   // Rojo
                    ],
                    borderColor: ['#198754', '#0d6efd', '#ffc107', '#dc3545'],
                    borderWidth: 0,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: isDark ? '#333' : '#e9ecef', drawBorder: false },
                        ticks: { color: isDark ? '#e0e0e0' : '#495057' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: isDark ? '#e0e0e0' : '#495057', font: { weight: 'bold' } }
                    }
                },
                plugins: {
                    legend: { labels: { color: isDark ? '#e0e0e0' : '#495057', font: { family: 'Inter' } } }
                }
            }
        });
    }
}

function updateChartsTheme(isDark) {
    if (stockChartInstance) {
        const gridColor = isDark ? '#333333' : '#e9ecef';
        const textColor = isDark ? '#e0e0e0' : '#495057';
        stockChartInstance.options.scales.x.ticks.color = textColor;
        stockChartInstance.options.scales.y.grid.color = gridColor;
        stockChartInstance.options.scales.y.ticks.color = textColor;
        stockChartInstance.options.plugins.legend.labels.color = textColor;
        stockChartInstance.update();
    }
}

/* --- MÓDULO 4: EVENTOS DEL ALMACÉN (VALIDACIÓN DUAL CRÍTICA) --- */
function bindProductEvents() {
    
    // VALIDACIÓN FRONTEND: Evitar salida mayor al stock
    const formsMovimiento = document.querySelectorAll('.form-movimiento');
    formsMovimiento.forEach(form => {
        
        const selectMovimiento = form.querySelector('.select-movimiento');
        const inputCantidad = form.querySelector('.input-cantidad');
        const stockReal = parseInt(form.getAttribute('data-stock'), 10);

        // Dinámicamente modificar el 'max' del HTML5 dependiendo si es ingreso o salida
        selectMovimiento.addEventListener('change', function() {
            if (this.value === 'INGRESO') {
                inputCantidad.removeAttribute('max');
                inputCantidad.classList.remove('is-invalid');
            } else {
                // Si es VENTA, MERMA o DEFECTUOSO, el tope es el stock actual
                inputCantidad.setAttribute('max', stockReal);
            }
        });

        // Interceptor del submit como última capa de defensa antes del servidor
        form.addEventListener('submit', function(e) {
            const cantidadIngresada = parseInt(inputCantidad.value, 10);
            const tipo = selectMovimiento.value;
            
            if (tipo !== 'INGRESO' && cantidadIngresada > stockReal) {
                e.preventDefault(); // BLOQUEO INMEDIATO
                inputCantidad.classList.add('is-invalid'); // Dispara el invalid-feedback de Bootstrap
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Stock Insuficiente',
                        text: `Imposible extraer ${cantidadIngresada} unidades. Solo dispone de ${stockReal}.`,
                        confirmButtonColor: '#0d6efd'
                    });
                } else {
                    alert(`ERROR: Imposible extraer ${cantidadIngresada} unidades. Solo dispone de ${stockReal}.`);
                }
            } else {
                inputCantidad.classList.remove('is-invalid');
            }
        });
    });

    // SweetAlert2 para Eliminación de Registro
    const deleteButtons = document.querySelectorAll('.btn-delete-product');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const form = this.closest('form');
            const productName = this.getAttribute('data-name') || 'este artículo';
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '¿Confirmar destrucción de datos?',
                    text: `Va a eliminar permanentemente [${productName}]. Esta acción quedará grabada en los logs de auditoría general.`,
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
                if(confirm(`Atención: Va a eliminar ${productName}. ¿Desea proceder?`)) {
                    form.submit();
                }
            }
        });
    });
}

/* --- MÓDULO 5: UTILERÍAS UX --- */
function initTooltips() {
    if(typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

function initAlerts() {
    // Las alertas de éxito desaparecen solas tras 5 segundos. Las de ERROR de stock se quedan fijas.
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