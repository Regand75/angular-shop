import {Component, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {

  cart: CartType | null = null;

  products: FavoriteType[] = [];
  serverStaticPath = environment.serverStaticPath;

  constructor(private favoriteService: FavoriteService, private cartService: CartService) {
  }

  ngOnInit(): void {

    this.favoriteService.getFavorites()
      .subscribe((favoritesData: FavoriteType[] | DefaultResponseType) => {
        if ((favoritesData as DefaultResponseType).error !== undefined) {
          throw new Error((favoritesData as DefaultResponseType).massage);
        }

        this.cartService.getCart()
          .subscribe((cartData: CartType | DefaultResponseType) => {
            if ((cartData as DefaultResponseType).error !== undefined) {
              throw new Error((cartData as DefaultResponseType).massage);
            }
            this.cart = cartData as CartType;
            this.products = (favoritesData as FavoriteType[]).map(product => {
              const productInCart = this.cart?.items.find(item => item.product.id === product.id);
              return {
                ...product,
                count: productInCart ? productInCart.quantity : 1,
                countInCart: productInCart ? productInCart.quantity : 0
              };
            });
          });
      });
  }

  addToCart(product: FavoriteType): void {
    if (product.count) {
      this.cartService.updateCart(product.id, product.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).massage);
          }
          product.countInCart = product.count;

        });
    }
  }

  updateCount(product: FavoriteType, value: number): void {
    product.count = value;
    if (product.countInCart) {
      this.cartService.updateCart(product.id, product.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).massage);
          }
          product.countInCart = product.count;
        });
    }
  }

  removeFromCart(product: FavoriteType): void {
    this.cartService.updateCart(product.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).massage);
        }
        product.countInCart = 0;
        product.count = 1;
      });
  }

  removeFromFavorites(id: string): void {
    this.favoriteService.removeFavorites(id)
      .subscribe((data: DefaultResponseType) => {
        if (data.error) {
          //...
          throw new Error(data.massage);
        }

        this.products = this.products.filter(item => item.id !== id);
      })
  }
}
