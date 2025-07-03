import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CotizacionService } from '../../services/cotizacion.service';

interface Cotizacion {
  id?: number;
  fecha: string;
  precioCompra: number;
  precioVenta: number;
  precioIntermedio: number;
}

// Validador personalizado para año de 4 dígitos
function yearFourDigitsValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = new Date(control.value);
  const año = fecha.getFullYear();
  if (año.toString().length !== 4) {
    return { yearFourDigits: true };
  }
  return null;
}

@Component({
  selector: 'app-cotizacion-dolar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cotizacion-dolar.component.html',
  styleUrls: ['./cotizacion-dolar.component.css']
})

export class CotizacionDolarComponent implements OnInit {
  cotizacionForm: FormGroup;
  autocompleteForm: FormGroup;
  cotizaciones: Cotizacion[] = [];
  editandoCotizacion: Cotizacion | null = null; // Cotización que se está editando
  modoEdicion = false; // Indica si estamos en modo edición
  // Fecha inicial fija: 1 de septiembre de 2023
  private readonly FECHA_INICIAL = new Date(2023, 8, 1); // Mes 8 = Septiembre (0-based)

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cotizacionService: CotizacionService
  ) {
    this.cotizacionForm = this.fb.group({
      fecha: [new Date(), [Validators.required, yearFourDigitsValidator]],
      precioCompra: ['', [Validators.required, Validators.min(0)]],
      precioVenta: ['', [Validators.required, Validators.min(0)]]
    });

    this.autocompleteForm = this.fb.group({
      fechaHasta: [new Date(), [Validators.required, yearFourDigitsValidator]]
    });
  }

  ngOnInit() {
    this.cargarCotizaciones();
    // getCotizaciones
  }

  onSubmit() {
    if (this.cotizacionForm.valid) {
      if (this.modoEdicion && this.editandoCotizacion?.id) {
        // Modo edición - actualizar cotización existente
        this.cotizacionService.updateCotizacion(this.editandoCotizacion.id, this.cotizacionForm.value).subscribe({
          next: () => {
            this.cotizacionForm.reset({fecha: new Date()});
            this.editandoCotizacion = null;
            this.modoEdicion = false;
            this.cargarCotizaciones();
            if (typeof window !== 'undefined') {
              alert('Cotización actualizada exitosamente');
            }
          },
          error: (error: Error) => {
            console.error('Error al actualizar:', error);
            if (typeof window !== 'undefined') {
              alert('Error al actualizar la cotización');
            }
          }
        });
      } else {
        // Modo creación - crear nueva cotización
        this.cotizacionService.createCotizacion(this.cotizacionForm.value).subscribe({
          next: () => {
            // Mantener la fecha actual en lugar de resetear a new Date()
            const fechaActual = this.cotizacionForm.get('fecha')?.value;
            this.cotizacionForm.reset({fecha: fechaActual});
            this.cargarCotizaciones();
            if (typeof window !== 'undefined') {
              alert('Cotización guardada exitosamente');
            }
          },
          error: (error: Error) => {
            console.error('Error al guardar:', error);
            if (typeof window !== 'undefined') {
              alert('Error al guardar la cotización');
            }
          }
        });
      }
    }
  }

  cargarCotizaciones() {
    this.cotizacionService.getAllCotizaciones().subscribe({
      next: (data: Cotizacion[]) => {
        // Ordenar por fecha descendente (más recientes primero) y tomar solo las últimas 35
        this.cotizaciones = data
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 35);
      },
      error: (error: Error) => console.error('Error cargando cotizaciones:', error)
    });
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  autocompletarCotizaciones() {
    if (this.autocompleteForm.valid) {
      const fechaHasta = this.autocompleteForm.get('fechaHasta')?.value;
      const fechas = this.obtenerFechasEntre(this.FECHA_INICIAL, fechaHasta);
      
      // Ordenar cotizaciones por fecha
      const cotizacionesOrdenadas = [...this.cotizaciones].sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      // Crear un mapa de fechas existentes para búsqueda rápida (todas en formato YYYY-MM-DD)
      const fechasExistentes = new Set(cotizacionesOrdenadas.map(c => this.formatearFecha(new Date(c.fecha))));
      
      let ultimaCotizacion: Cotizacion | null = null;
      const cotizacionesAAgregar: Cotizacion[] = [];

      // Primero, encontrar la primera cotización disponible
      if (cotizacionesOrdenadas.length > 0) {
        ultimaCotizacion = cotizacionesOrdenadas[0];
      }

      for (const fecha of fechas) {
        const fechaStr = this.formatearFecha(fecha);
        
        // Si la fecha NO existe en las cotizaciones actuales (comparando en formato YYYY-MM-DD)
        if (!fechasExistentes.has(fechaStr)) {
          // Buscar la última cotización disponible antes de esta fecha
          const cotizacionAnterior = cotizacionesOrdenadas
            .filter(c => new Date(c.fecha) < fecha)
            .pop();

          if (cotizacionAnterior) {
            ultimaCotizacion = cotizacionAnterior;
          }

          if (ultimaCotizacion) {
            cotizacionesAAgregar.push({
              fecha: fechaStr,
              precioCompra: ultimaCotizacion.precioCompra,
              precioVenta: ultimaCotizacion.precioVenta,
              precioIntermedio: ultimaCotizacion.precioIntermedio
            });
          }
        } else {
          // Actualizar la última cotización conocida
          const cotizacionActual = cotizacionesOrdenadas.find(c => this.formatearFecha(new Date(c.fecha)) === fechaStr);
          if (cotizacionActual) {
            ultimaCotizacion = cotizacionActual;
          }
        }
      }

      // Guardar todas las cotizaciones nuevas
      if (cotizacionesAAgregar.length > 0) {
        console.log('Fechas a autocompletar:', cotizacionesAAgregar.map((c: Cotizacion) => c.fecha));
        
        // Crear las cotizaciones una por una
        const crearCotizaciones = async () => {
          const errores: { fecha: string; error: any }[] = [];
          const exitosas: string[] = [];

          for (const cotizacion of cotizacionesAAgregar) {
            try {
              // Esperar un pequeño delay entre cada creación para evitar problemas de concurrencia
              await new Promise(resolve => setTimeout(resolve, 500));
              
              console.log(`Intentando crear cotización para ${cotizacion.fecha}...`);
              await this.cotizacionService.createCotizacion(cotizacion).toPromise();
              console.log(`Cotización creada exitosamente para ${cotizacion.fecha}`);
              exitosas.push(cotizacion.fecha);
            } catch (error: any) {
              console.error(`Error al crear cotización para ${cotizacion.fecha}:`, error);
              errores.push({
                fecha: cotizacion.fecha,
                error: error.error?.message || error.message || 'Error desconocido'
              });
            }
          }

          // Reportar resultados
          if (errores.length > 0) {
            const mensajeError = `Error al crear algunas cotizaciones:\n${errores.map(e => 
              `- ${e.fecha}: ${e.error}`
            ).join('\n')}`;
            console.error(mensajeError);
            throw new Error(mensajeError);
          }

          return exitosas;
        };

        crearCotizaciones()
          .then((exitosas) => {
            this.cargarCotizaciones();
            if (exitosas.length === cotizacionesAAgregar.length) {
              if (typeof window !== 'undefined') {
                alert(`Se autocompletaron exitosamente ${exitosas.length} cotizaciones`);
              }
            } else {
              if (typeof window !== 'undefined') {
                alert(`Se autocompletaron ${exitosas.length} de ${cotizacionesAAgregar.length} cotizaciones. Revisa la consola para más detalles.`);
              }
            }
          })
          .catch((error) => {
            console.error('Error al autocompletar:', error);
            if (typeof window !== 'undefined') {
              alert(`Error al autocompletar las cotizaciones:\n${error.message}\n\nPor favor, intenta nuevamente o contacta al administrador.`);
            }
          });
      } else {
        console.log('Fechas disponibles:', fechas.map((f: Date) => this.formatearFecha(f)));
        console.log('Fechas existentes:', Array.from(fechasExistentes));
        if (typeof window !== 'undefined') {
          alert('No se encontraron fechas para autocompletar. Verifica que haya fechas entre el 01-09-2023 y la fecha seleccionada.');
        }
      }
    }
  }

  private obtenerFechasEntre(fechaInicio: Date, fechaFin: Date): Date[] {
    const fechas: Date[] = [];
    const fechaActual = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    fechaActual.setHours(0, 0, 0, 0);
    fechaFinObj.setHours(0, 0, 0, 0);

    console.log('Buscando fechas entre:', this.formatearFecha(fechaActual), 'y', this.formatearFecha(fechaFinObj));

    while (fechaActual <= fechaFinObj) {
      // AGREGAR TODOS LOS DÍAS, INCLUYENDO FINES DE SEMANA
      fechas.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  editarCotizacion(cotizacion: Cotizacion) {
    this.editandoCotizacion = cotizacion;
    this.modoEdicion = true;
    
    // Llenar el formulario con los datos de la cotización
    this.cotizacionForm.patchValue({
      fecha: cotizacion.fecha,
      precioCompra: cotizacion.precioCompra,
      precioVenta: cotizacion.precioVenta
    });
  }

  cancelarEdicion() {
    this.editandoCotizacion = null;
    this.modoEdicion = false;
    this.cotizacionForm.reset({fecha: new Date()});
  }

  eliminarCotizacion(cotizacion: Cotizacion) {
    if (typeof window !== 'undefined' && confirm(`¿Está seguro que desea eliminar la cotización del ${cotizacion.fecha}?`)) {
      if (cotizacion.id) {
        this.cotizacionService.deleteCotizacion(cotizacion.id).subscribe({
          next: () => {
            console.log('Cotización eliminada exitosamente');
            this.cargarCotizaciones(); // Recargar la lista
            if (typeof window !== 'undefined') {
              alert('Cotización eliminada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error al eliminar la cotización:', error);
            if (typeof window !== 'undefined') {
              alert('Error al eliminar la cotización');
            }
          }
        });
      }
    }
  }
}
