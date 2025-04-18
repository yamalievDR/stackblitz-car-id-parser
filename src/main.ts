import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { VehicleNumberInputComponent } from './vehicle-number-input';

@Component({
  selector: 'app-root',
  imports: [VehicleNumberInputComponent],
  template: `
   <vehicle-number-input (typeDetected)="onVehicleNumberDetected($event)"/>
  `,
})
export class App {
  onVehicleNumberDetected(event: {type: 'vin' | 'license' | 'body', value: string}) {
    console.log(`Detected ${event.type}: ${event.value}`);
  }
}

bootstrapApplication(App);
