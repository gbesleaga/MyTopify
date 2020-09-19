import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-menu-content',
  templateUrl: './menu-content.component.html',
  styleUrls: ['../../style/common.css', './menu-content.component.css']
})
export class MenuContentComponent implements OnInit {

  constructor(private router: Router,
              private authService: AuthService) { }

  ngOnInit() {
  }

  onProceedToGame() {
    this.router.navigate(['game/select']);
  }

  onProceedToChart() {
    this.router.navigate(['chart/view']);
  }

  onLogout() {
    // TODO
  }
}