import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';

@Component({
  selector: 'app-forma-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forma-pago.component.html',
  styleUrl: './forma-pago.component.css'
})

export class FormaPagoComponent implements OnInit {
  formaPagoForm: FormGroup;
  tiposPago = ['EFECTIVO', 'TARJETA'];
  marcasTarjeta = ['VISA', 'MASTERCARD'];
  meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  formasPago: FormaPago[] = [];
  editandoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private formaPagoService: FormaPagoService
  ) {
    this.formaPagoForm = this.fb.group({
      tipo: ['', Validators.required],
      banco: [''],
      marcaTarjeta: [''],
      diaCierre: [null],
      diaVencimiento: [null],
      mes: [''],
      activo: [true]
    });

    // Escuchar cambios en el tipo de pago
    this.formaPagoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'TARJETA') {
        this.formaPagoForm.get('banco')?.setValidators(Validators.required);
        this.formaPagoForm.get('marcaTarjeta')?.setValidators(Validators.required);
        this.formaPagoForm.get('mes')?.setValidators(Validators.required);
      } else {
        this.formaPagoForm.get('banco')?.clearValidators();
        this.formaPagoForm.get('marcaTarjeta')?.clearValidators();
        this.formaPagoForm.get('mes')?.clearValidators();
        // Limpiar los campos relacionados con tarjeta
        this.formaPagoForm.patchValue({
          banco: '',
          marcaTarjeta: '',
          diaCierre: null,
          diaVencimiento: null,
          mes: ''
        });
      }
      this.formaPagoForm.get('banco')?.updateValueAndValidity();
      this.formaPagoForm.get('marcaTarjeta')?.updateValueAndValidity();
      this.formaPagoForm.get('mes')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.cargarFormasPago();
  }

  cargarFormasPago() {
    this.formaPagoService.obtenerFormasPago()
      .subscribe({
        next: (formas) => {
          this.formasPago = formas;
         // console.log('Formas de pago cargadas:', formas);
        },
        error: (error) => {
          console.error('Error al cargar formas de pago:', error);
          alert('Error al cargar las formas de pago');
        }
      });
  }

  editarFormaPago(forma: FormaPago) {
    this.editandoId = forma.id!;
    this.formaPagoForm.patchValue(forma);
  }

  onSubmit() {
    if (this.formaPagoForm.valid) {
      console.log('Datos a enviar:', this.formaPagoForm.value); // Para ver qué datos estamos enviando

      this.formaPagoService.crearFormaPago(this.formaPagoForm.value).subscribe({
        next: (response) => {
          console.log('Forma de pago creada:', response);
          this.formaPagoForm.reset();
          alert('Forma de pago creada exitosamente');
        },
        error: (error) => {
          console.error('Error completo:', error);
          console.error('Mensaje del servidor:', error.error);
          console.error('Estado:', error.status);
          console.error('Detalles:', error.error?.message || error.message);
          
          alert(`Error al crear forma de pago: ${error.error?.message || 'Error en el servidor'}`);
        }
      });
    }
  }

  eliminarFormaPago(id: number) {
    if (confirm('¿Está seguro de eliminar esta forma de pago?')) {
      this.formaPagoService.eliminarFormaPago(id)
        .subscribe({
          next: () => {
            alert('Forma de pago eliminada exitosamente');
            this.cargarFormasPago();
          },
          error: (error) => {
            console.error('Error al eliminar forma de pago:', error);
            alert('Error al eliminar la forma de pago');
          }
        });
    }
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }
}
