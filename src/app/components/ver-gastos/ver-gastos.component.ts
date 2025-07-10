import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GastoService, Gasto } from '../../services/gasto.service';
import { TipoGastoService } from '../../services/tipo-gasto.service';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';

@Component({
  selector: 'app-ver-gastos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ver-gastos.component.html',
  styleUrl: './ver-gastos.component.css'
})
export class VerGastosComponent implements OnInit {
  
  // Formularios
  formularioRangoFechas: FormGroup;
  formularioCantidad: FormGroup;
  
  // Datos
  gastos: Gasto[] = [];
  tiposGasto: any[] = [];
  formasPago: FormaPago[] = [];
  
  // Estados
  cargando = false;
  modoBusqueda: 'rango' | 'cantidad' | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gastoService: GastoService,
    private tipoGastoService: TipoGastoService,
    private formaPagoService: FormaPagoService
  ) {
    // Formulario para rango de fechas
    this.formularioRangoFechas = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });

    // Formulario para cantidad de gastos
    this.formularioCantidad = this.fb.group({
      cantidad: [50, [Validators.required, Validators.min(1), Validators.max(1000)]]
    });
  }

  ngOnInit() {
    this.cargarTiposGasto();
    this.cargarFormasPago();
  }

  cargarTiposGasto() {
    this.tipoGastoService.getTiposGasto().subscribe({
      next: (tipos) => {
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
    this.formaPagoService.getFormasPago().subscribe({
      next: (formas) => {
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

  buscarPorRangoFechas() {
    if (this.formularioRangoFechas.valid) {
      this.cargando = true;
      this.modoBusqueda = 'rango';
      
      const { fechaInicio, fechaFin } = this.formularioRangoFechas.value;
      
      this.gastoService.getGastosPorRangoFechas(fechaInicio, fechaFin).subscribe({
        next: (gastos) => {
          this.gastos = gastos;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al buscar gastos por rango:', error);
          this.cargando = false;
          if (typeof window !== 'undefined') {
            alert('Error al buscar gastos por rango de fechas');
          }
        }
      });
    }
  }

  buscarPorCantidad() {
    if (this.formularioCantidad.valid) {
      this.cargando = true;
      this.modoBusqueda = 'cantidad';
      
      const { cantidad } = this.formularioCantidad.value;
      
      this.gastoService.getUltimosGastos(cantidad).subscribe({
        next: (gastos) => {
          this.gastos = gastos;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al buscar últimos gastos:', error);
          this.cargando = false;
          if (typeof window !== 'undefined') {
            alert('Error al buscar últimos gastos');
          }
        }
      });
    }
  }

  limpiarResultados() {
    this.gastos = [];
    this.modoBusqueda = null;
  }

  volverAlInicio() {
    this.router.navigate(['/']);
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

  formatearFormaPago(forma: FormaPago): string {
    if (forma.tipo === 'EFECTIVO') {
      return 'EFECTIVO';
    }
    if (forma.tipo === 'TARJETA') {
      let fechaCierreTexto = '';
      if (forma.fechaCierre && typeof forma.fechaCierre === 'string' && forma.fechaCierre.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [anio, mes, dia] = forma.fechaCierre.split('-');
        const mesNombre = new Date(0, parseInt(mes, 10) - 1).toLocaleString('es-ES', { month: 'long' });
        fechaCierreTexto = `${dia}-${this.capitalizeFirstLetter(mesNombre)}`;
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

  private capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 