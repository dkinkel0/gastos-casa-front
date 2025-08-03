import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GastoPorMesService } from '../../services/gasto-por-mes.service';
import { TipoGastoService } from '../../services/tipo-gasto.service';

@Component({
  selector: 'app-ver-historico',
  templateUrl: './ver-historico.component.html',
  styleUrls: ['./ver-historico.component.css'],
  imports: [CommonModule, DecimalPipe],
  standalone: true
})
export class VerHistoricoComponent implements OnInit {
  gastosPorMes: any[] = [];
  tiposGasto: any[] = [];
  meses: string[] = [];
  cargando = false;
  error = '';

  constructor(
    private router: Router,
    private gastoPorMesService: GastoPorMesService,
    private tipoGastoService: TipoGastoService
  ) {}

  ngOnInit() {
    this.cargarTiposGasto();
  }

  cargarTiposGasto() {
    this.tipoGastoService.getTiposGasto().subscribe({
      next: (tipos) => {
        this.tiposGasto = tipos;
        this.cargarHistorico();
      },
      error: (error) => {
        console.error('Error al cargar tipos de gasto:', error);
        this.error = 'Error al cargar los tipos de gasto';
        this.cargando = false;
      }
    });
  }

  cargarHistorico() {
    this.cargando = true;
    this.error = '';

    // Generar lista de meses desde septiembre 2023 hasta el mes actual
    this.meses = this.generarListaMeses();
    
    this.gastoPorMesService.obtenerGastosPorRangoMeses(this.meses).subscribe({
      next: (data) => {
        this.gastosPorMes = this.transformarDatosParaTabla(data);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar histórico:', error);
        this.error = 'Error al cargar el histórico de gastos';
        this.cargando = false;
      }
    });
  }

  generarListaMeses(): string[] {
    const meses: string[] = [];
    const fechaInicio = new Date(2023, 8, 1); // Septiembre 2023
    const fechaActual = new Date();
    
    let fecha = new Date(fechaInicio);
    
    while (fecha <= fechaActual) {
      const mesAño = fecha.getFullYear() + '-' + 
                     String(fecha.getMonth() + 1).padStart(2, '0');
      meses.push(mesAño);
      
      fecha.setMonth(fecha.getMonth() + 1);
    }
    
    return meses.reverse(); // Más recientes primero
  }

  transformarDatosParaTabla(data: any[]): any[] {
    // Crear un mapa para almacenar los datos por mes y tipo de gasto
    const datosPorMes = new Map<string, Map<string, any>>();
    
    // Inicializar el mapa con todos los meses
    this.meses.forEach(mes => {
      datosPorMes.set(mes, new Map());
      this.tiposGasto.forEach(tipo => {
        datosPorMes.get(mes)!.set(tipo.nombre, { pesos: 0, dolares: 0 });
      });
    });
    
    // Llenar con los datos reales
    data.forEach(item => {
      const mes = item.mesAño;
      const tipoNombre = item.tipoGastoNombre;
      
      if (datosPorMes.has(mes)) {
        datosPorMes.get(mes)!.set(tipoNombre, {
          pesos: item.totalPesos,
          dolares: item.totalDolares
        });
      }
    });
    
    // Convertir a array de objetos
    return this.meses.map(mes => {
      const datosMes = datosPorMes.get(mes)!;
      const datosPorTipo = this.tiposGasto.map(tipo => ({
        tipoGasto: tipo,
        ...datosMes.get(tipo.nombre)
      }));
      
      return {
        mes: mes,
        datosPorTipo: datosPorTipo
      };
    });
  }

  obtenerValorPorMesYTipo(mes: string, tipoGasto: any): any {
    const datosMes = this.gastosPorMes.find(item => item.mes === mes);
    if (datosMes) {
      const datosTipo = datosMes.datosPorTipo.find((d: any) => d.tipoGasto.id === tipoGasto.id);
      return datosTipo || { pesos: 0, dolares: 0 };
    }
    return { pesos: 0, dolares: 0 };
  }

  formatearMes(mesAno: string): string {
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  }

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }
} 