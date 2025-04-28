import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GastoService } from '../../services/gasto.service';
import { TipoGastoService } from '../../services/tipo-gasto.service';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gastoService: GastoService,
    private tipoGastoService: TipoGastoService,
    private formaPagoService: FormaPagoService
  ) {
    this.gastoForm = this.fb.group({
      fecha: ['', Validators.required],
      detalle: ['', Validators.required],
      tipo: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      costoDolar: [''],
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
  }

  ngOnInit() {
    this.cargarTiposGasto();
    this.cargarFormasPago();
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
        this.formasPago = formas;
      },
      error: (error) => {
        console.error('Error al cargar formas de pago:', error);
        alert('Error al cargar formas de pago');
      }
    });
  }

  calcularCostoDolar() {
    const fecha = this.gastoForm.get('fecha')?.value;
    const costo = this.gastoForm.get('costo')?.value;
    
    if (fecha && costo) {
      this.gastoService.getCotizacionDolar(fecha).subscribe({
        next: (cotizacion) => {
          const costoDolar = costo / cotizacion.precioIntermedio;
          this.gastoForm.patchValue({
            costoDolar: costoDolar.toFixed(2)
          }, { emitEvent: false });
        },
        error: (error) => {
          console.error('Error al obtener cotización del dólar:', error);
          this.gastoForm.patchValue({
            costoDolar: ''
          }, { emitEvent: false });
        }
      });
    }
  }

  onSubmit() {
    if (this.gastoForm.valid) {
        const gastoData = {
            fecha: this.gastoForm.get('fecha')?.value,
            detalle: this.gastoForm.get('detalle')?.value,
            tipo: Number(this.gastoForm.get('tipo')?.value),
            costo: Number(this.gastoForm.get('costo')?.value),
            costoDolar: Number(this.gastoForm.get('costoDolar')?.value),
            formaPago: Number(this.gastoForm.get('formaPago')?.value),
            cuotas: this.gastoForm.get('cuotas')?.value ? Number(this.gastoForm.get('cuotas')?.value) : undefined
        };

        console.log('Datos estructurados a enviar:', gastoData);

        // Validar que la fecha no sea futura
        const fechaGasto = new Date(gastoData.fecha);
        if (fechaGasto > new Date()) {
            alert('La fecha no puede ser futura');
            return;
        }

        this.gastoService.crearGasto(gastoData).subscribe({
            next: (response) => {
                console.log('Gasto guardado exitosamente', response);
                this.gastoForm.reset();
                alert('Gasto guardado exitosamente');
            },
            error: (error) => {
                console.error('Error completo:', error);
                console.error('Datos del error:', error.error);
                alert(`Error al guardar el gasto: ${error.error?.message || 'Error en el servidor'}`);
            }
        });
    }
}

  mostrarCampoCuotas(): boolean {
    const formaPagoId = this.gastoForm.get('formaPago')?.value;
    const formaPago = this.formasPago.find(f => f.id === formaPagoId);
    return formaPago?.tipo === 'TARJETA';
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }
}
