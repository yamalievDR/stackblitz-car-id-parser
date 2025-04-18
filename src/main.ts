import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { VehicleNumberInputComponent } from './vehicle-number-input';

@Component({
  selector: 'app-root',
  imports: [VehicleNumberInputComponent],
  template: `
   <vehicle-number-input 
  (typeDetected)="onVehicleNumberDetected($event)">
</vehicle-number-input>
  `,
})
export class App {}

bootstrapApplication(App);
