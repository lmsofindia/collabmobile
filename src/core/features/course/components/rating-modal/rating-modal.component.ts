// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, Input, OnInit } from '@angular/core';
import { CoreSite } from '@classes/site';
import { ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

@Component({
    selector: 'app-rating-modal',
    templateUrl: './rating-modal.component.html',
    styleUrls: ['./rating-modal.component.scss'],
})
export class RatingModalComponent implements OnInit {

   @Input() ratingInfo: {
     rating: number;
     review: string;
     courseid: number;
   } = {
      rating: 0,
      review: '',
      courseid: 0,
    };

   protected site: CoreSite;

    rating = 0;
    review = '';
    courseid = 0;

    processing = false;

    constructor(private modalCtrl: ModalController) {
        this.site = CoreSites.getRequiredCurrentSite();
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.rating = this.ratingInfo.rating;
        this.review = this.ratingInfo.review;
        this.courseid = this.ratingInfo.courseid;
        this.processing = false;
    }

    cancel(): Promise<boolean> {
        return this.modalCtrl.dismiss(null, 'cancel');
    }

    selectRating(rating: number): void {
        if (this.processing) {
            return;
        }

        this.rating = rating;
    }

    /**
     * Save course rating.
     *
     * @returns Promise resolved when done.
     */
    async saveRating(): Promise<void> {
        if (!this.courseid) {
            return;
        }

        this.processing = true;

        try {
            const response: {
                success: boolean;
                message: string;
            } = await CoreSites.getRequiredCurrentSite().write('local_course_catalogue_rate_course', {
                courseid: this.courseid,
                rating: this.rating,
                review: this.review,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            CoreDomUtils.showToast(response.message);

            this.processing = false;

            await this.modalCtrl.dismiss({
                rating: this.rating,
                review: this.review,
            }, 'confirm');
        } catch (error) {
            CoreDomUtils.showErrorModal(error || 'Error saving rating');
            this.processing = false;
        }
    }

}
