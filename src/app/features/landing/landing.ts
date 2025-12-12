import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';  

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {

}
