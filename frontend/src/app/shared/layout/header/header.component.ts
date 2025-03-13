import {Component, Input, OnInit} from '@angular/core';
import {CategoryType} from "../../../../types/category.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isLogged: boolean = false;
  @Input() categories: CategoryType[] = [];

  constructor(private authService: AuthService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLogged = isLoggedIn;
    });
  }

  logout(): void {

  }

}
