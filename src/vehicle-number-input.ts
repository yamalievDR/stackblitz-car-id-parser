import { Component, EventEmitter, Output, Pipe, PipeTransform } from '@angular/core';
import { IMaskDirective, IMaskModule } from 'angular-imask';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Pipe({
    name: 'vehicleType',
    standalone: true
})
export class VehicleTypePipe implements PipeTransform {
    transform(value: 'vin' | 'license' | 'body' | null): string {
        switch (value) {
            case 'vin':
                return 'VIN номер';
            case 'license':
                return 'Госномер РФ';
            case 'body':
                return 'Номер кузова';
            default:
                return '';
        }
    }
}

@Component({
    selector: 'vehicle-number-input',
    standalone: true,
    imports: [FormsModule, CommonModule, VehicleTypePipe],
    template: `
        <div class="vehicle-input-container">
            <input
                    [(ngModel)]="vehicleNumber"
                    (ngModelChange)="onInputChange($event)"
                    (blur)="validateInput()"
                    placeholder="Введите VIN, госномер или номер кузова"
                    type="text"
                    [class.error]="showError"
            />
            <div class="input-hint" *ngIf="detectedType">
                Определен: {{ detectedType | vehicleType }}
                <span *ngIf="detectedType === 'vin' && !isValidVin" class="error-message"> (некорректный VIN)</span>
            </div>
            <div class="error-message" *ngIf="showError && errorMessage">
                {{ errorMessage }}
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

        input.error {
            border-color: #f44336;
        }

        .input-hint {
            margin-top: 4px;
            font-size: 12px;
            color: #666;
        }

        .error-message {
            color: #f44336;
            font-size: 12px;
            margin-top: 4px;
        }
    `]
})
export class VehicleNumberInputComponent {
    vehicleNumber = '';
    detectedType: 'vin' | 'license' | 'body' | null = null;
    isValidVin = true;
    showError = false;
    errorMessage = '';

    @Output() typeDetected = new EventEmitter<{
        type: 'vin' | 'license' | 'body';
        value: string;
        isValid: boolean;
    }>();

    onInputChange(value: string) {
        this.vehicleNumber = value.toUpperCase();
        this.showError = false;
        this.detectNumberType(this.vehicleNumber);
    }

    validateInput() {
        if (!this.vehicleNumber) {
            this.showError = false;
            return;
        }

        this.detectNumberType(this.vehicleNumber, true);
    }

    private detectNumberType(value: string, fullValidation = false) {
        // Сначала проверяем VIN (самый строгий формат)
        if (this.isPotentialVIN(value)) {
            this.detectedType = 'vin';
            this.isValidVin = fullValidation ? this.validateVinChecksum(value) : true;

            if (fullValidation && !this.isValidVin) {
                this.showError = true;
                this.errorMessage = 'Некорректный VIN (проверьте контрольную сумму)';
            }

            this.emitType();
            return;
        }

        // Затем проверяем госномер
        if (this.isLicensePlate(value)) {
            this.detectedType = 'license';
            this.isValidVin = true;
            this.emitType();
            return;
        }

        // Затем номер кузова
        if (this.isBodyNumber(value)) {
            this.detectedType = 'body';
            this.isValidVin = true;
            this.emitType();
            return;
        }

        // Если ничего не подошло
        this.detectedType = null;
        if (fullValidation) {
            this.showError = true;
            this.errorMessage = 'Неизвестный формат номера';
        }
    }

    private emitType() {
        if (this.detectedType) {
            this.typeDetected.emit({
                type: this.detectedType,
                value: this.vehicleNumber,
                isValid: this.detectedType === 'vin' ? this.isValidVin : true
            });
        }
    }

    // Проверка формата VIN (без контрольной суммы)
    private isPotentialVIN(value: string): boolean {
        return /^[A-HJ-NPR-Z0-9]{17}$/i.test(value);
    }

    // Проверка контрольной суммы VIN
    private validateVinChecksum(vin: string): boolean {
        // Проверка длины и допустимых символов
        if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
            return false;
        }

        const vinStr = vin.toUpperCase();
        const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

        // Таблица замены букв на числа
        const letterValues: {[key: string]: number} = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
            'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
            'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
        };

        let sum = 0;

        for (let i = 0; i < 17; i++) {
            const char = vinStr[i];
            let value: number;

            // Для букв берем значение из таблицы
            if (/[A-Z]/.test(char)) {
                value = letterValues[char];
                if (value === undefined) return false; // Недопустимая буква
            }
            // Для цифр - числовое значение
            else if (/[0-9]/.test(char)) {
                value = parseInt(char, 10);
            }
            // Недопустимый символ
            else {
                return false;
            }

            // Умножаем на вес и добавляем к сумме
            sum += value * weights[i];
        }

        // Получаем контрольную цифру (9-й символ)
        const checkDigit = vinStr[8];

        // Вычисляем ожидаемую контрольную цифру
        const remainder = sum % 11;
        let expectedCheckDigit: string;

        if (remainder === 10) {
            expectedCheckDigit = 'X';
        } else {
            expectedCheckDigit = remainder.toString();
        }

        // Сравниваем с фактической контрольной цифрой
        return checkDigit === expectedCheckDigit;
    }

    // Проверка госномера
    private isLicensePlate(value: string): boolean {
        return /^[АВЕКМНОРСТУХ]{1}\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/iu.test(value) ||
            /^\d{4}[АВЕКМНОРСТУХ]{2}\d{2}$/iu.test(value) ||
            /^[АВЕКМНОРСТУХ]{2}\d{5,6}$/iu.test(value);
    }

    // Проверка номера кузова
    private isBodyNumber(value: string): boolean {
        return /^[A-Z0-9\-]{6,17}$/i.test(value) && !this.isPotentialVIN(value);
    }
}
