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

import { Component, OnInit } from '@angular/core';
import { CoreSite } from '@classes/site';
import { IonRefresher } from '@ionic/angular';
import { CoreSites } from '@services/sites';

@Component({
    selector: 'page-addon-shorts',
    templateUrl: 'shorts.html',
    styleUrls: ['shorts.scss'],
})
export class AddonShortsPage implements OnInit {

    title = '';

    protected siteHomeId: number;
    currentSite!: CoreSite;

    loaded = false;
    currentUserId: number;

    shorts: [] = [];

    protected observer!: IntersectionObserver | null;

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
    }

    /**
     * View loaded.
     */
    async ngOnInit(): Promise<void> {
        this.title = 'Shorts';

        this.fetchData();
    }

    /**
     * Fetch the data.
     *
     * @param refresh Empty events array first.
     * @returns Promise with the entries.
     */
    protected async fetchData(refresh: boolean = false): Promise<void> {
        if (refresh) {
            // this.pageLoaded = 0;
        }

        await this.getShorts();

        this.loaded = true;

        setTimeout(() => {
            this.observeVideos();
        }, 100);
    }

    protected async getShorts(): Promise<void> {
        return this.currentSite.read('local_course_catalogue_get_shorts', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            per_page: 50,
        }).then((data) => {
            this.shorts = (data as { shorts: [] })['shorts'] || [];

            return;
        }).catch(() => {
            this.shorts = [];
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

    observeVideos(): void {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target as HTMLVideoElement;

                if (!entry.isIntersecting) {
                    video.pause();

                    return;
                }

                if (!video.dataset.src) {
                    return;
                }

                // check if video already has source
                if (!video.src || video.src != video.dataset.src) {
                    video.src = video.dataset.src;
                }

                video.play();

                return;
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.5,
        });

        const videos = document.querySelectorAll('video');

        videos.forEach((video) => {
            video.pause();
            this.observer?.observe(video);
        });
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    toggleLike(short: any): void {
        if(short.is_liked) {
            short.likes--;
            short.is_liked = false;
        } else {
            short.likes++;
            short.is_liked = true;
        }
    }

    toggleDislike(short: any): void {
        if(short.is_disliked) {
            short.dislikes--;
            short.is_disliked = false;
        } else {
            short.dislikes++;
            short.is_disliked = true;
        }
    }

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
