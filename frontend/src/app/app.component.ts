import { Component } from '@angular/core';
import { RequestComponent } from './components/request/request.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RequestComponent],
  template: '<app-request></app-request>',
})
export class AppComponent {}
