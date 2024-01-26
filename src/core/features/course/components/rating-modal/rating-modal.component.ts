import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NavParams } from '@ionic/angular';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrls: ['./rating-modal.component.scss'],
})
export class RatingModalComponent implements OnInit {
   @Input() ratingInfo: any;

  constructor(private modalCtrl: ModalController, private navParams: NavParams) {
    console.log(navParams.get('ratingInfo'));
   }

  ngOnInit() {}

  cancel(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }
}
