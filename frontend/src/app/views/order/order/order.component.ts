import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {DeliveryType} from "../../../../types/delivery.type";
import {FormBuilder, Validators} from "@angular/forms";
import {PaymentType} from "../../../../types/payment.type";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {OrderService} from "../../../shared/services/order.service";
import {OrderType} from "../../../../types/order.type";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  cart: CartType | null = null;
  totalAmount: number = 0;
  totalCount: number = 0;
  deliveryType: DeliveryType = DeliveryType.delivery;
  deliveryTypes = DeliveryType;
  paymentTypes = PaymentType;
  dialogRef: MatDialogRef<any> | null = null;

  orderFrom = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    fatherName: [''],
    paymentType: [PaymentType.cashToCourier, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
    comment: [''],
  });

  @ViewChild('popup') popup!: TemplateRef<ElementRef>;

  constructor(private cartService: CartService,
              private _snackBar: MatSnackBar,
              private fb: FormBuilder,
              private dialog: MatDialog,
              private orderService: OrderService,
              private route: Router) {
    this.updateDeliveryTypeValidation();
  }

  ngOnInit(): void {
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).massage);
        }
        this.cart = data as CartType;
        if (!this.cart || (this.cart && this.cart.items.length === 0)) {
          this._snackBar.open('Корзина пустая');
          this.route.navigate(['/']);
          return;
        }
        this.calculateTotal();
      })
  }

  calculateTotal(): void {
    this.totalAmount = 0;
    this.totalCount = 0;
    if (this.cart) {
      this.cart.items.forEach(item => {
        this.totalAmount += item.quantity + item.product.price;
        this.totalCount += item.quantity;
      });
    }
  }

  changeDeliveryType(type: DeliveryType): void {
    this.deliveryType = type;
    this.updateDeliveryTypeValidation();
  }

  updateDeliveryTypeValidation(): void {
    if (this.deliveryType === DeliveryType.delivery) {
      this.orderFrom.get('street')?.setValidators(Validators.required);
      this.orderFrom.get('house')?.setValidators(Validators.required);
    } else {
      this.orderFrom.get('street')?.removeValidators(Validators.required);
      this.orderFrom.get('house')?.removeValidators(Validators.required);
      this.orderFrom.get('street')?.setValue('');
      this.orderFrom.get('house')?.setValue('');
      this.orderFrom.get('entrance')?.setValue('');
      this.orderFrom.get('apartment')?.setValue('');
    }
    this.orderFrom.get('street')?.updateValueAndValidity();
    this.orderFrom.get('house')?.updateValueAndValidity();
  }

  createOrder(): void {
    if (this.orderFrom.valid && this.orderFrom.value.firstName && this.orderFrom.value.lastName
      && this.orderFrom.value.phone && this.orderFrom.value.paymentType && this.orderFrom.value.email) {

      const paramsObject: OrderType = {
        deliveryType: this.deliveryType,
        firstName: this.orderFrom.value.firstName,
        lastName: this.orderFrom.value.lastName,
        phone: this.orderFrom.value.phone,
        paymentType: this.orderFrom.value.paymentType,
        email: this.orderFrom.value.email,
      };

      if (this.deliveryType === DeliveryType.delivery) {
        if (this.orderFrom.value.street) {
          paramsObject.street = this.orderFrom.value.street;
        }
        if (this.orderFrom.value.apartment) {
          paramsObject.apartment = this.orderFrom.value.apartment;
        }
        if (this.orderFrom.value.house) {
          paramsObject.house = this.orderFrom.value.house;
        }
        if (this.orderFrom.value.entrance) {
          paramsObject.entrance = this.orderFrom.value.entrance;
        }
      }

      if (this.orderFrom.value.comment) {
        paramsObject.comment = this.orderFrom.value.comment;
      }

      this.orderService.createOrder(paramsObject)
        .subscribe({
          next: (data: OrderType | DefaultResponseType) => {
            if ((data as DefaultResponseType).error !== undefined) {
              throw new Error((data as DefaultResponseType).massage);
            }
            this.dialogRef = this.dialog.open(this.popup);
            this.dialogRef.backdropClick()
              .subscribe(() => {
                this.route.navigate(['/']);
              });
              this.cartService.setCount(0);
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка заказа');
            }
          }
        });
    } else {
      this.orderFrom.markAllAsTouched();
      this._snackBar.open('Заполните необходимые поля');
    }
  }

  closePopup(): void {
    this.dialogRef?.close();
    this.route.navigate(['/']);
  }

}
