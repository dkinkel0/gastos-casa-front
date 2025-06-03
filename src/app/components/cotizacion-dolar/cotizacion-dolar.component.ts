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
      this.cotizacionService.createCotizacion(this.cotizacionForm.value).subscribe({
        next: () => {
          this.cotizacionForm.reset({fecha: new Date()});
          this.cargarCotizaciones();
        },
        error: (error: Error) => console.error('Error al guardar:', error)
      });
    }
  }

  cargarCotizaciones() {
    this.cotizacionService.getAllCotizaciones().subscribe({
      next: (data: Cotizacion[]) => this.cotizaciones = data,
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
      
      console.log('Fechas a procesar:', fechas.map(f => this.formatearFecha(f)));
      
      // Ordenar cotizaciones por fecha
      const cotizacionesOrdenadas = [...this.cotizaciones].sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      
      console.log('Cotizaciones existentes:', cotizacionesOrdenadas.map(c => c.fecha));

      // Crear un mapa de fechas existentes para búsqueda rápida
      const fechasExistentes = new Set(cotizacionesOrdenadas.map(c => c.fecha));
      
      let ultimaCotizacion: Cotizacion | null = null;
      const cotizacionesAAgregar: Cotizacion[] = [];

      // Primero, encontrar la primera cotización disponible
      if (cotizacionesOrdenadas.length > 0) {
        ultimaCotizacion = cotizacionesOrdenadas[0];
      }

      for (const fecha of fechas) {
        const fechaStr = this.formatearFecha(fecha);
        
        // Si la fecha no existe en las cotizaciones actuales
        if (!fechasExistentes.has(fechaStr)) {
          // Buscar la última cotización disponible antes de esta fecha
          const cotizacionAnterior = cotizacionesOrdenadas
            .filter(c => new Date(c.fecha) < fecha)
            .pop();

          if (cotizacionAnterior) {
            ultimaCotizacion = cotizacionAnterior;
          }

          if (ultimaCotizacion) {
            console.log(`Agregando cotización para ${fechaStr} usando valores de ${ultimaCotizacion.fecha}`);
            cotizacionesAAgregar.push({
              fecha: fechaStr,
              precioCompra: ultimaCotizacion.precioCompra,
              precioVenta: ultimaCotizacion.precioVenta,
              precioIntermedio: ultimaCotizacion.precioIntermedio
            });
          }
        } else {
          // Actualizar la última cotización conocida
          const cotizacionActual = cotizacionesOrdenadas.find(c => c.fecha === fechaStr);
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
              alert(`Se autocompletaron exitosamente ${exitosas.length} cotizaciones`);
            } else {
              alert(`Se autocompletaron ${exitosas.length} de ${cotizacionesAAgregar.length} cotizaciones. Revisa la consola para más detalles.`);
            }
          })
          .catch((error) => {
            console.error('Error al autocompletar:', error);
            alert(`Error al autocompletar las cotizaciones:\n${error.message}\n\nPor favor, intenta nuevamente o contacta al administrador.`);
          });
      } else {
        console.log('Fechas disponibles:', fechas.map((f: Date) => this.formatearFecha(f)));
        console.log('Fechas existentes:', Array.from(fechasExistentes));
        alert('No se encontraron fechas para autocompletar. Verifica que haya fechas entre el 01-09-2023 y la fecha seleccionada.');
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
}
