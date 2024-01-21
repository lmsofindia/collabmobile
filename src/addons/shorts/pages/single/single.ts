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

import { ShortLikeDislikeResponse } from '@addons/shorts/services/shorts';
import { Component, OnInit } from '@angular/core';
import { CoreSite } from '@classes/site';
import { IonRefresher } from '@ionic/angular';
import { CoreNavigator } from '@services/navigator';
// import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

@Component({
    selector: 'page-addon-shorts-single',
    templateUrl: 'single.html',
    styleUrls: ['single.scss'],
})
export class AddonShortsSinglePage implements OnInit {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    title = 'Loading...';

    shortId = 0;

    short: any;

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
    }

    /**
     * View loaded.
     */
    async ngOnInit(): Promise<void> {
        this.shortId = CoreNavigator.getRequiredRouteNumberParam('shortId');

        await this.fetchData();
    }

    /**
     * Fetch the data.
     *
     * @param refresh Empty events array first.
     * @returns Promise with the entries.
     */
    protected async fetchData(refresh: boolean = false): Promise<void> {
        this.loaded = false;

        if (refresh) {
            // this.pageLoaded = 0;
        }

        try {
            this.short = await this.currentSite.read('local_course_catalogue_get_short', {
                id: this.shortId,
            });

            this.title = this.short['fullname'];
        } catch {
            this.short = undefined;
            CoreDomUtils.showErrorModal('Error loading data.');
        }

        this.loaded = true;
    }

    toggleLike(): void {
        this.likeDislike( 1);
    }

    toggleDislike(): void {
        this.likeDislike( 0);
    }

    likeDislike(likeflag: number): void {
        this.currentSite.read('local_course_catalogue_toggle_short_like', {
            short_id: this.short['id'],
            likeflag,
        }, {
            updateFrequency: CoreSite.FREQUENCY_USUALLY,
            getFromCache: false,
            saveToCache: false,
        }).then((data: ShortLikeDislikeResponse) => {
            if(data['success']) {
                this.short['likes'] = data['likes'];
                this.short['is_liked'] = data['is_liked'];
                this.short['is_disliked'] = data['is_disliked'];
                this.short['dislikes'] = data['dislikes'];

               // CoreDomUtils.showAlert(undefined, data['message']);
            }

            return;
        }).catch(() => {
            // do nothing
        });
    }

    toggleState(event: Event): void {
        const video = event.target as HTMLVideoElement;

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }

    /**
     * Fetch the courses.
     *
     * @returns Promise with the entries.
     */
    // protected async fetchProgram(): Promise<void> {
    //     return this.currentSite.read('local_course_catalogue_get_program', {
    //         id: this.programId,
    //     }).then((response: any) => {
    //         this.program = response;

    //         return;
    //     }).catch(() => {
    //         //
    //     });
    // }

    /**
     * Refresh data.
     *
     * @param refresher Refresher instance.
     */
    refresh(refresher?: IonRefresher): void {
        this.loaded = false;

        this.fetchData(true).finally(() => {
            if (refresher) {
                refresher?.complete();
            }
        });
    }

}
