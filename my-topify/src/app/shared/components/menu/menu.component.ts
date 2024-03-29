/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */

import { Component } from '@angular/core';
import { MenuService } from '../../menu.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['../../style/common.css', './menu.component.css']
})
export class MenuComponent {

  showMenu = false;


  constructor(private menu: MenuService) { 
    this.menu.registerMenu(this.onOpenMenu.bind(this));
  }


  /**
   * The menu gets opened through the MenuService
   */
  onOpenMenu() {
    this.showMenu = true;
  }


  onCloseMenu() {
    this.showMenu = false;
  }
}
