import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { GastoService, Gasto } from '../../services/gasto.service';
import { TipoGastoService } from '../../services/tipo-gasto.service';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';
import { CotizacionService, Cotizacion } from '../../services/cotizacion.service';

@Component({
  selector: 'app-gasto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gasto.component.html',
  styleUrl: './gasto.component.css'
})

export class GastoComponent implements OnInit {
  gastoForm: FormGroup;
  tiposGasto: any[] = [];
  formasPago: FormaPago[] = [];
  cotizaciones: { [fecha: string]: number } = {}; // Almacenará las cotizaciones por fecha

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
        alert('Error al cargar tipos de gasto');
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
        alert('Error al cargar formas de pago');
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
        alert('Error al cargar las cotizaciones del dólar');
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
      }
    }
  }

  onSubmit() {
    if (this.gastoForm.valid) {
      // Convertir los valores numéricos correctamente
      const gastoData: Gasto = {
        ...this.gastoForm.value,
        tipo: Number(this.gastoForm.value.tipo),
        costo: Number(this.gastoForm.value.costo),
        costoDolar: Number(this.gastoForm.value.costoDolar),
        cuotas: this.mostrarCampoCuotas() ? Number(this.gastoForm.value.cuotas) : null
      };
      
      console.log('Datos estructurados a enviar:', gastoData);
      
      this.gastoService.crearGasto(gastoData).subscribe({
        next: (response) => {
          console.log('Gasto guardado exitosamente', response);
          this.gastoForm.reset();
          // Aquí podrías agregar un mensaje de éxito o redireccionar
        },
        error: (error) => {
          console.error('Error al guardar el gasto', error);
          console.log('Error completo:', error);
          console.log('Datos del error:', error.error);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });
    }
  }

  mostrarCampoCuotas(): boolean {
    const formaPagoId = this.gastoForm.get('formaPago')?.value;
    const formaPago = this.formasPago.find(f => f.id == formaPagoId); // Usar == para comparar string/number
    console.log('Forma de pago seleccionada:', formaPago);
    // Ajusta aquí si el campo correcto es 'tipo' o 'nombre'
    return formaPago?.tipo === 'TARJETA' || formaPago?.nombre?.toUpperCase() === 'TARJETA';
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
      // Formatear fecha de cierre
      let fechaCierreTexto = '';
      if (forma.fechaCierre) {
        const fecha = new Date(forma.fechaCierre);
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-ES', { month: 'long' });
        fechaCierreTexto = `${dia}-${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
      }
      
      // Construir el texto según el formato especificado
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
}
