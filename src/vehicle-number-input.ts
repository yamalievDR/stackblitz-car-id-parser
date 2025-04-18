import { Component, EventEmitter, Output } from '@angular/core';
import { IMaskDirective, IMaskModule } from 'angular-imask';

@Component({
  selector: 'vehicle-number-input',
  standalone: true,
  imports: [IMaskDirective, IMaskModule],
  template: `
    <div class="vehicle-input-container">
      <input
        #input
        [(ngModel)]="vehicleNumber"
        [imask]="maskOptions"
        (accept)="onAccept()"
        (complete)="onComplete()"
        placeholder="Введите VIN, госномер или номер кузова"
        type="text"
      />
      <div class="input-hint" *ngIf="detectedType">
        Определен: {{ detectedType | vehicleType }}
      </div>
    </div>
  `,
  styles: [`
    .vehicle-input-container {
      position: relative;
      margin: 1rem 0;
    }
    
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .input-hint {
      margin-top: 4px;
      font-size: 12px;
      color: #666;
    }
  `]
})
export class VehicleNumberInputComponent {
  vehicleNumber = '';
  detectedType: 'vin' | 'license' | 'body' | null = null;
  
  @Output() typeDetected = new EventEmitter<{
    type: 'vin' | 'license' | 'body';
    value: string;
  }>();

  // Mask options for different vehicle number types
  maskOptions = {
    mask: (value: string) => {
      if (this.isVIN(value)) {
        this.detectedType = 'vin';
        return this.vinMask;
      }
      if (this.isLicensePlate(value)) {
        this.detectedType = 'license';
        return this.licenseMask;
      }
      if (this.isBodyNumber(value)) {
        this.detectedType = 'body';
        return this.bodyMask;
      }
      this.detectedType = null;
      return /^.*$/; // Default mask - any characters
    },
    dispatch: (appended: string, dynamicMasked: any) => {
      const value = dynamicMasked.value + appended;
      return dynamicMasked.compiledMasks.find((m: any) => {
        if (this.isVIN(value)) return m === this.vinMask;
        if (this.isLicensePlate(value)) return m === this.licenseMask;
        if (this.isBodyNumber(value)) return m === this.bodyMask;
        return m === /^.*$/;
      });
    }
  };

  // Mask for VIN (17 alphanumeric chars, excluding I,O,Q)
  vinMask = {
    mask: 'X{17}',
    definitions: {
      X: /[A-HJ-NPR-Za-hj-npr-z0-9]/
    },
    prepare: (str: string) => str.toUpperCase()
  };

  // Mask for Russian license plates
  licenseMask = {
    mask: [
      {
        mask: 'A 999 AA 999',
        lazy: false,
        definitions: {
          A: /[АВЕКМНОРСТУХавекмнорстух]/,
          '9': /[0-9]/
        },
        prepare: (str: string) => str.toUpperCase()
      },
      {
        mask: 'AA 999999',
        lazy: false,
        definitions: {
          A: /[АВЕКМНОРСТУХавекмнорстух]/,
          '9': /[0-9]/
        },
        prepare: (str: string) => str.toUpperCase()
      }
    ]
  };

  // Mask for body numbers (6-17 alphanumeric + hyphen)
  bodyMask = {
    mask: 'X{6,17}',
    definitions: {
      X: /[A-Za-z0-9\-]/
    },
    prepare: (str: string) => str.toUpperCase()
  };

  // Validation patterns
  private isVIN(value: string): boolean {
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(value);
  }

  private isLicensePlate(value: string): boolean {
    return /^[АВЕКМНОРСТУХ]{1}\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/iu.test(value) ||
           /^\d{4}[АВЕКМНОРСТУХ]{2}\d{2}$/iu.test(value) ||
           /^[АВЕКМНОРСТУХ]{2}\d{5,6}$/iu.test(value);
  }

  private isBodyNumber(value: string): boolean {
    return /^[A-Z0-9\-]{6,17}$/i.test(value) && !this.isVIN(value);
  }

  onAccept() {
    if (this.detectedType && this.vehicleNumber) {
      this.typeDetected.emit({
        type: this.detectedType,
        value: this.vehicleNumber
      });
    }
  }

  onComplete() {
    this.onAccept();
  }
}