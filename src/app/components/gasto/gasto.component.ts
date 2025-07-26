import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { GastoService, Gasto } from '../../services/gasto.service';
import { TipoGastoService } from '../../services/tipo-gasto.service';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';
import { CotizacionService, Cotizacion } from '../../services/cotizacion.service';

// Función utilitaria fuera de la clase y antes de la exportación
function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

@Component({
  selector: 'app-gasto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gasto.component.html',
  styleUrl: './gasto.component.css'
})

export class GastoComponent implements OnInit, AfterViewInit {
  @ViewChild('detalleInput', { static: false }) detalleInput!: ElementRef;
  
  gastoForm: FormGroup;
  tiposGasto: any[] = [];
  formasPago: FormaPago[] = [];
  cotizaciones: { [fecha: string]: number } = {}; // Almacenará las cotizaciones por fecha
  gastos: Gasto[] = []; // Lista de gastos para mostrar en la tabla
  editandoGasto: Gasto | null = null; // Gasto que se está editando
  modoEdicion = false; // Indica si estamos en modo edición

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gastoService: GastoService,
    private tipoGastoService: TipoGastoService,
    private formaPagoService: FormaPagoService,
    private cotizacionService: CotizacionService
  ) {
    this.gastoForm = this.fb.group({
      fecha: ['', [Validators.required, this.validarFormatoFecha()]],
      detalle: ['', Validators.required],
      tipo: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      costoDolar: ['', [Validators.required, Validators.min(0)]],
      formaPago: ['', Validators.required],
      cuotas: ['']
    });

    // Escuchar cambios en fecha y costo para calcular costo en dólares
    this.gastoForm.get('fecha')?.valueChanges.subscribe(() => {
      this.calcularCostoDolar();
    });
    this.gastoForm.get('costo')?.valueChanges.subscribe(() => {
      this.calcularCostoDolar();
    });

    // Escuchar cambios en forma de pago para manejar el campo de cuotas
    this.gastoForm.get('formaPago')?.valueChanges.subscribe((formaPagoId) => {
      if (this.mostrarCampoCuotas()) {
        this.gastoForm.get('cuotas')?.setValidators([Validators.required, Validators.min(1), Validators.max(24)]);
      } else {
        this.gastoForm.get('cuotas')?.clearValidators();
        this.gastoForm.get('cuotas')?.setValue('');
      }
      this.gastoForm.get('cuotas')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.cargarTiposGasto();
    this.cargarFormasPago();
    this.cargarCotizaciones();
    this.cargarUltimosGastos();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.detalleInput) {
        this.detalleInput.nativeElement.focus();
      }
    });
  }

  cargarTiposGasto() {
    this.tipoGastoService.getTiposGasto().subscribe({
      next: (tipos) => {
        // Ordenar alfabéticamente por nombre
        this.tiposGasto = tipos.sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
      },
      error: (error) => {
        console.error('Error al cargar tipos de gasto:', error);
        if (typeof window !== 'undefined') {
          alert('Error al cargar tipos de gasto');
        }
      }
    });
  }

  cargarFormasPago() {
    console.log('Cargando formas de pago...');
    this.formaPagoService.getFormasPago().subscribe({
      next: (formas) => {
        console.log('Formas de pago recibidas:', formas);
        // Filtrar solo las formas de pago activas
        this.formasPago = formas.filter(forma => forma.activo);
      },
      error: (error) => {
        console.error('Error al cargar formas de pago:', error);
        if (typeof window !== 'undefined') {
          alert('Error al cargar formas de pago');
        }
      }
    });
  }

  cargarCotizaciones() {
    this.cotizacionService.getAllCotizaciones().subscribe({
      next: (cotizaciones: Cotizacion[]) => {
        // Convertir el array de cotizaciones a un objeto indexado por fecha
        this.cotizaciones = cotizaciones.reduce((acc: { [fecha: string]: number }, cotizacion: Cotizacion) => {
          acc[cotizacion.fecha] = cotizacion.precioIntermedio;
          return acc;
        }, {});
        
        console.log('Cotizaciones cargadas:', this.cotizaciones);
      },
      error: (error: Error) => {
        console.error('Error al cargar cotizaciones:', error);
        if (typeof window !== 'undefined') {
          alert('Error al cargar las cotizaciones del dólar');
        }
      }
    });
  }

  cargarUltimosGastos() {
    this.gastoService.getAllGastos().subscribe({
      next: (gastos) => {
        // Ordenar por fecha descendente y tomar los últimos 150
        this.gastos = gastos
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 200);
      },
      error: (error) => {
        console.error('Error al cargar gastos:', error);
        if (typeof window !== 'undefined') {
          alert('Error al cargar los gastos');
        }
      }
    });
  }

  calcularCostoDolar() {
    const fecha = this.gastoForm.get('fecha')?.value;
    const costo = this.gastoForm.get('costo')?.value;
    
    if (fecha && costo) {
      // Usar la cotización precargada
      const cotizacion = this.cotizaciones[fecha];
      
      if (cotizacion) {
        const costoDolar = costo / cotizacion;
        this.gastoForm.patchValue({
          costoDolar: costoDolar.toFixed(2)
        }, { emitEvent: false });
      } else {
        console.warn('No se encontró cotización para la fecha:', fecha);
        this.gastoForm.patchValue({
          costoDolar: ''
        }, { emitEvent: false });
        
        // Mostrar alert y abortar la carga del gasto
        if (typeof window !== 'undefined') {
          alert(`No se encontró cotización del dólar para la fecha ${fecha}. Por favor, verifique que la cotización esté cargada antes de continuar.`);
        }
        return false;
      }
    }
    return true;
  }

  onSubmit() {
    if (this.gastoForm.valid) {
      // Validar que el costo en dólares esté presente
      const costoDolar = this.gastoForm.get('costoDolar')?.value;
      if (!costoDolar || costoDolar <= 0) {
        if (typeof window !== 'undefined') {
          alert('El costo en dólares no puede estar vacío. Verifique que la cotización del dólar esté disponible para la fecha seleccionada.');
        }
        return;
      }
      
      // Convertir los valores numéricos correctamente
      const gastoData: Gasto = {
        ...this.gastoForm.value,
        tipo: Number(this.gastoForm.value.tipo),
        costo: Number(this.gastoForm.value.costo),
        costoDolar: Number(this.gastoForm.value.costoDolar),
        cuotas: this.mostrarCampoCuotas() ? Number(this.gastoForm.value.cuotas) : null
      };
      
      console.log('Datos estructurados a enviar:', gastoData);
      
      if (this.modoEdicion && this.editandoGasto?.id) {
        // Modo edición - actualizar gasto existente
        this.gastoService.updateGasto(this.editandoGasto.id, gastoData).subscribe({
          next: (response) => {
            console.log('Gasto actualizado exitosamente', response);
            this.gastoForm.reset();
            this.editandoGasto = null;
            this.modoEdicion = false;
            this.cargarUltimosGastos(); // Recargar la lista
            if (typeof window !== 'undefined') {
              alert('Gasto actualizado exitosamente');
            }
            setTimeout(() => {
              if (this.detalleInput) {
                this.detalleInput.nativeElement.focus();
              }
            });
          },
          error: (error) => {
            console.error('Error al actualizar el gasto', error);
            if (typeof window !== 'undefined') {
              alert('Error al actualizar el gasto');
            }
          }
        });
      } else {
        // Modo creación - crear nuevo gasto
        this.gastoService.crearGasto(gastoData).subscribe({
          next: (response) => {
            console.log('Gasto guardado exitosamente', response);
            // Mantener la fecha actual en lugar de resetear completamente
            const fechaActual = this.gastoForm.get('fecha')?.value;
            this.gastoForm.reset({fecha: fechaActual});
            this.cargarUltimosGastos(); // Recargar la lista
            if (typeof window !== 'undefined') {
              alert('Gasto guardado exitosamente');
            }
            setTimeout(() => {
              if (this.detalleInput) {
                this.detalleInput.nativeElement.focus();
              }
            });
          },
          error: (error) => {
            console.error('Error al guardar el gasto', error);
            console.log('Error completo:', error);
            console.log('Datos del error:', error.error);
            if (typeof window !== 'undefined') {
              alert('Error al guardar el gasto');
            }
          }
        });
      }
    }
  }

  mostrarCampoCuotas(): boolean {
    const formaPagoId = this.gastoForm.get('formaPago')?.value;
    if (!formaPagoId || this.formasPago.length === 0) {
      return false;
    }
    
    const formaPago = this.formasPago.find(f => f.id == formaPagoId); // Usar == para comparar string/number
    console.log('Forma de pago seleccionada:', formaPago);
    
    if (!formaPago) {
      return false;
    }
    
    // Ajusta aquí si el campo correcto es 'tipo' o 'nombre'
    return formaPago.tipo === 'TARJETA' || formaPago.nombre?.toUpperCase() === 'TARJETA';
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }

  // Agregar el validador personalizado
  validarFormatoFecha(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const fecha = new Date(control.value);
      const año = fecha.getFullYear();
      
      if (año.toString().length !== 4) {
        return { añoInvalido: true };
      }
      
      return null;
    };
  }

  formatearFormaPago(forma: FormaPago): string {
    if (forma.tipo === 'EFECTIVO') {
      return 'EFECTIVO';
    }
    if (forma.tipo === 'TARJETA') {
      // Formatear fecha de cierre correctamente desde string YYYY-MM-DD
      let fechaCierreTexto = '';
      if (forma.fechaCierre && typeof forma.fechaCierre === 'string' && forma.fechaCierre.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [anio, mes, dia] = forma.fechaCierre.split('-');
        const mesNombre = new Date(0, parseInt(mes, 10) - 1).toLocaleString('es-ES', { month: 'long' });
        fechaCierreTexto = `${dia}-${capitalizeFirstLetter(mesNombre)}`;
      }
      const partes = [
        fechaCierreTexto,
        forma.banco,
        forma.marcaTarjeta,
        forma.titular
      ].filter(parte => parte && parte.trim() !== '');
      return partes.join('-');
    }
    return forma.nombre || forma.tipo;
  }

  editarGasto(gasto: Gasto) {
    this.editandoGasto = gasto;
    this.modoEdicion = true;
    
    // Llenar el formulario con los datos del gasto
    this.gastoForm.patchValue({
      fecha: gasto.fecha,
      detalle: gasto.detalle,
      tipo: gasto.tipo,
      costo: gasto.costo,
      costoDolar: gasto.costoDolar,
      formaPago: gasto.formaPago,
      cuotas: gasto.cuotas || ''
    });
  }

  cancelarEdicion() {
    this.editandoGasto = null;
    this.modoEdicion = false;
    this.gastoForm.reset();
    setTimeout(() => {
      if (this.detalleInput) {
        this.detalleInput.nativeElement.focus();
      }
    });
  }

  eliminarGasto(gasto: Gasto) {
    if (typeof window !== 'undefined' && confirm(`¿Está seguro que desea eliminar el gasto "${gasto.detalle}"?`)) {
      if (gasto.id) {
        this.gastoService.deleteGasto(gasto.id).subscribe({
          next: () => {
            console.log('Gasto eliminado exitosamente');
            this.cargarUltimosGastos(); // Recargar la lista
            if (typeof window !== 'undefined') {
              alert('Gasto eliminado exitosamente');
            }
          },
          error: (error) => {
            console.error('Error al eliminar el gasto:', error);
            if (typeof window !== 'undefined') {
              alert('Error al eliminar el gasto');
            }
          }
        });
      }
    }
  }

  obtenerNombreTipo(tipo: any): string {
    return tipo && tipo.nombre ? tipo.nombre : 'N/A';
  }

  obtenerNombreFormaPago(formaPago: any): string {
    if (!formaPago) return 'N/A';

    // Si es un objeto con tipo, úsalo directamente
    if (typeof formaPago === 'object' && formaPago.tipo) {
      return this.formatearFormaPago(formaPago);
    }

    // Si es un ID, búscalo en el array
    const forma = this.formasPago.find(f => f.id == formaPago);
    if (!forma) return 'N/A';
    return this.formatearFormaPago(forma);
  }
}
