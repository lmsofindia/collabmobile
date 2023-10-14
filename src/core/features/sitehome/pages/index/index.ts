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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonRefresher } from '@ionic/angular';
import { Params } from '@angular/router';

import { CoreSite, CoreSiteConfig } from '@classes/site';
import { CoreCourse, CoreCourseWSSection } from '@features/course/services/course';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreSites } from '@services/sites';
import { CoreCourses } from '@features//courses/services/courses';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreCourseHelper, CoreCourseModuleData } from '@features/course/services/course-helper';
import { CoreNavigationOptions, CoreNavigator } from '@services/navigator';
import { CoreUtils } from '@services/utils/utils';

/**
 * Page that displays site home index.
 */
@Component({
    selector: 'page-core-sitehome-index',
    templateUrl: 'index.html',
    styleUrls: ['index.scss'],
})
export class CoreSiteHomeIndexPage implements OnInit, OnDestroy {

    dataLoaded = false;
    section?: CoreCourseWSSection & {
        hasContent?: boolean;
    };

    hasContent = false;
    hasBlocks = false;
    items: string[] = [];
    siteHomeId = 1;
    currentSite!: CoreSite;
    searchEnabled = false;
    newsForumModule?: CoreCourseModuleData;

    protected updateSiteObserver: CoreEventObserver;
    protected fetchSuccess = false;

    sliders: string | null = null;

    shorts: [] = [];

    cacheKeys = {
        sliders: 'sitehome:theme_slideshows',
        shorts: 'sitehome:shorts',
    };

    constructor() {
        // Refresh the enabled flags if site is updated.
        this.updateSiteObserver = CoreEvents.on(CoreEvents.SITE_UPDATED, () => {
            this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();
        }, CoreSites.getCurrentSiteId());
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();

        this.currentSite = CoreSites.getRequiredCurrentSite();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();

        const module = CoreNavigator.getRouteParam<CoreCourseModuleData>('module');
        if (module) {
            let modNavOptions = CoreNavigator.getRouteParam<CoreNavigationOptions>('modNavOptions');
            if (!modNavOptions) {
                // Fallback to old way of passing params. @deprecated since 4.0.
                const modParams = CoreNavigator.getRouteParam<Params>('modParams');
                if (modParams) {
                    modNavOptions = { params: modParams };
                }
            }
            CoreCourseHelper.openModule(module, this.siteHomeId, { modNavOptions });
        }

        this.loadContent().finally(() => {
            this.dataLoaded = true;
        });
    }

    /**
     * Convenience function to fetch the data.
     *
     * @returns Promise resolved when done.
     */
    protected async loadContent(): Promise<void> {
        try {
            this.getSliders();
            this.getShorts();

            if (!this.fetchSuccess) {
                this.fetchSuccess = true;
                CoreUtils.ignoreErrors(CoreCourse.logView(
                    this.siteHomeId,
                    undefined,
                    undefined,
                    this.currentSite.getInfo()?.sitename,
                ));
            }
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'core.course.couldnotloadsectioncontent', true);
        }
    }

    /**
     * Refresh the data.
     *
     * @param refresher Refresher.
     */
    doRefresh(refresher?: IonRefresher): void {
        const promises: Promise<unknown>[] = [];

        promises.push(this.currentSite.invalidateConfig().then(async () => {
            // Config invalidated, fetch it again.
            const config: CoreSiteConfig = await this.currentSite.getConfig();
            this.currentSite.setConfig(config);

            return;
        }));

        Promise.all(promises).finally(async () => {
            // invalidate all caches.
            Object.keys(this.cacheKeys).forEach((key) => {
                this.currentSite.invalidateWsCacheForKey(this.cacheKeys[key]);
            });

            await this.loadContent().finally(() => {
                refresher?.complete();
            });
        });
    }

    /**
     * Get sliders
     */
    getSliders(): void {
        this.currentSite.read<string>('local_collab_function_get_sliders', {}, {
            updateFrequency: CoreSite.FREQUENCY_RARELY,
            getFromCache: true,
            saveToCache: true,
            cacheKey: this.cacheKeys.sliders,
            component: 'sitehome',
            componentId: this.siteHomeId,
        }).then((data) => {
            this.sliders = data['html'];

            return this.sliders;
        }).catch(() => {
            // Ignore errors.
        });
    }

    /**
     * Get shorts
     */
    getShorts(): void {
        this.currentSite.read<[]>('local_course_catalogue_get_shorts', {}, {
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            getFromCache: true,
            saveToCache: true,
            cacheKey: this.cacheKeys.shorts,
            component: 'sitehome',
            componentId: this.siteHomeId,
        }).then((data) => {
            this.shorts = data['shorts'] || [];

            return this.shorts;
        }).catch(() => {
            // Ignore errors.
        });
    }

    /**
     * Go to search courses.
     */
    openSearch(): void {
        CoreNavigator.navigateToSitePath('courses/list', { params : { mode: 'search' } });
    }

    /**
     * Go to available courses.
     */
    openAvailableCourses(): void {
        CoreNavigator.navigateToSitePath('courses/list', { params : { mode: 'all' } });
    }

    /**
     * Go to my courses.
     */
    openMyCourses(): void {
        CoreNavigator.navigateToSitePath('courses/list', { params : { mode: 'my' } });
    }

    /**
     * Go to course categories.
     */
    openCourseCategories(): void {
        CoreNavigator.navigateToSitePath('courses/categories');
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.updateSiteObserver.off();
    }

}
