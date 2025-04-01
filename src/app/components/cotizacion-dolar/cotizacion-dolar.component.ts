import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CotizacionService } from '../../services/cotizacion.service';

interface Cotizacion {
  id: number;
  fecha: Date;
  precioCompra: number;
  precioVenta: number;
  precioIntermedio: number;
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
  precioIntermedio: number = 0;
  cotizaciones: Cotizacion[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cotizacionService: CotizacionService
  ) {
    this.cotizacionForm = this.fb.group({
      fecha: [new Date(), Validators.required],
      precioCompra: ['', [Validators.required, Validators.min(0)]],
      precioVenta: ['', [Validators.required, Validators.min(0)]]
    });

    // Calcular precio intermedio cuando cambien los valores
    this.cotizacionForm.valueChanges.subscribe(() => {
      this.calcularPrecioIntermedio();
    });
  }

  ngOnInit() {
    this.cargarCotizaciones();
  }

  calcularPrecioIntermedio() {
    const compra = this.cotizacionForm.get('precioCompra')?.value;
    const venta = this.cotizacionForm.get('precioVenta')?.value;
    
    if (compra && venta) {
      this.precioIntermedio = (Number(compra) + Number(venta)) / 2;
    }
  }

  onSubmit() {
    if (this.cotizacionForm.valid) {
      this.cotizacionService.saveCotizacion(this.cotizacionForm.value).subscribe({
        next: () => {
          this.cotizacionForm.reset({fecha: new Date()});
          this.cargarCotizaciones();
        },
        error: (error: Error) => console.error('Error al guardar:', error)
      });
    }
  }

  cargarCotizaciones() {
    this.cotizacionService.getCotizaciones().subscribe({
      next: (data: Cotizacion[]) => this.cotizaciones = data,
      error: (error: Error) => console.error('Error cargando cotizaciones:', error)
    });
  }

  volverHome() {
    this.router.navigate(['/home']);
  }
}