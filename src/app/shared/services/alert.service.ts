import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import Swal, {
  SweetAlertIcon,
  SweetAlertResult,
} from 'sweetalert2';

import { ApiErrorResponse } from '../interfaces/api/api-error-response.interface';

export interface AlertOptions {
  title: string;
  description?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

export interface ToastOptions {
  title: string;
  description?: string;
  icon?: SweetAlertIcon;
  timer?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {

  /*
  |--------------------------------------------------------------------------
  | ALERTA GENERAL
  |--------------------------------------------------------------------------
  */

  showAlert(
    options: AlertOptions,
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title: options.title,
      text: options.description,
      icon: options.icon,

      showCancelButton:
        options.showCancelButton ?? false,

      confirmButtonText:
        options.confirmButtonText ?? 'Aceptar',

      cancelButtonText:
        options.cancelButtonText ?? 'Cancelar',

      buttonsStyling: false,

      customClass: {
        popup: 'viaticos-alert-popup',
        title: 'viaticos-alert-title',
        htmlContainer: 'viaticos-alert-description',
        actions: 'viaticos-alert-actions',
        confirmButton: 'viaticos-alert-confirm',
        cancelButton: 'viaticos-alert-cancel',
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMACIÓN
  |--------------------------------------------------------------------------
  */

  confirm(
    title: string,
    description?: string,
    confirmButtonText = 'Confirmar',
  ): Promise<SweetAlertResult> {
    return this.showAlert({
      title,
      description,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | TOAST
  |--------------------------------------------------------------------------
  */

  showToast(
    options: ToastOptions,
  ): void {
    void Swal.fire({
      toast: true,
      position: 'bottom-end',

      icon: options.icon ?? 'success',
      iconColor: '#ffffff',

      title: options.title,
      text: options.description,

      showConfirmButton: false,

      timer: options.timer ?? 3500,
      timerProgressBar: true,

      customClass: {
        popup: this.getToastClass(
          options.icon ?? 'success',
        ),
        title: 'viaticos-toast-title',
        htmlContainer: 'viaticos-toast-description',
        timerProgressBar: 'viaticos-toast-progress',
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | ATAJOS
  |--------------------------------------------------------------------------
  */

  success(
    title = 'Operación realizada correctamente',
    description?: string,
  ): void {
    this.showToast({
      icon: 'success',
      title,
      description,
    });
  }

  error(
    title = 'Ocurrió un error',
    description?: string,
  ): void {
    this.showToast({
      icon: 'error',
      title,
      description,
      timer: 5000,
    });
  }

  warning(
    title: string,
    description?: string,
  ): void {
    this.showToast({
      icon: 'warning',
      title,
      description,
      timer: 4500,
    });
  }

  info(
    title: string,
    description?: string,
  ): void {
    this.showToast({
      icon: 'info',
      title,
      description,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | ERRORES HTTP
  |--------------------------------------------------------------------------
  */

  handleHttpError(
    error: HttpErrorResponse,
  ): void {
    const response =
      error.error as Partial<ApiErrorResponse>;

    const code =
      response.error?.code;

    const backendMessage =
      response.error?.message;

    switch (code) {

      case 'DUPLICATE_RESOURCE':
        void this.showAlert({
          icon: 'warning',
          title: 'Registro duplicado',
          description:
            'Ya existe un banco registrado con ese nombre.',
        });
        return;

      case 'VALIDATION_FAILED':
        void this.showAlert({
          icon: 'warning',
          title: 'Datos inválidos',
          description:
            this.getValidationMessage(response),
        });
        return;

      case 'INSUFFICIENT_PERMISSIONS':
        void this.showAlert({
          icon: 'error',
          title: 'Permisos insuficientes',
          description:
            'No tienes permisos para realizar esta operación.',
        });
        return;

      case 'RESOURCE_NOT_FOUND':
        void this.showAlert({
          icon: 'error',
          title: 'Registro no encontrado',
          description:
            'El registro solicitado no existe o ya no está disponible.',
        });
        return;

    }

    if (error.status === 0) {
      void this.showAlert({
        icon: 'error',
        title: 'Sin conexión',
        description:
          'No fue posible establecer comunicación con el servidor.',
      });
      return;
    }

    if (error.status === 401) {
      void this.showAlert({
        icon: 'warning',
        title: 'Sesión no válida',
        description:
          'Tu sesión expiró o no es válida. Inicia sesión nuevamente.',
      });
      return;
    }

    if (error.status === 403) {
      void this.showAlert({
        icon: 'error',
        title: 'Permisos insuficientes',
        description:
          'No tienes permisos para realizar esta operación.',
      });
      return;
    }

    void this.showAlert({
      icon: 'error',
      title: 'Error',
      description:
        backendMessage ??
        'Ocurrió un error inesperado. Intenta nuevamente.',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  private getToastClass(
    icon: SweetAlertIcon,
  ): string {
    const classes: Partial<
      Record<SweetAlertIcon, string>
    > = {
      success:
        'viaticos-toast viaticos-toast-success',

      error:
        'viaticos-toast viaticos-toast-error',

      warning:
        'viaticos-toast viaticos-toast-warning',

      info:
        'viaticos-toast viaticos-toast-info',

      question:
        'viaticos-toast viaticos-toast-info',
    };

    return classes[icon] ??
      'viaticos-toast viaticos-toast-info';
  }

  private getValidationMessage(
    response: Partial<ApiErrorResponse>,
  ): string {
    const details =
      response.error?.details ?? [];

    if (!details.length) {
      return 'Revisa la información capturada.';
    }

    return details
      .map(detail => {
        const field =
          detail.field ??
          'Campo';

        const issue =
          detail.issue ??
          'Valor inválido';

        return `${field}: ${issue}`;
      })
      .join('\n');
  }

}
