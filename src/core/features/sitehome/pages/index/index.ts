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

import { CoreSite, CoreSiteConfig, CoreSiteWSPreSets } from '@classes/site';
import { CoreCourse, CoreCourseWSSection } from '@features/course/services/course';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreSites } from '@services/sites';
import { CoreCourses } from '@features//courses/services/courses';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreCourseHelper, CoreCourseModuleData } from '@features/course/services/course-helper';
import { CoreNavigationOptions, CoreNavigator } from '@services/navigator';
import { CoreUtils } from '@services/utils/utils';
import { CoreUser, CoreUserProfile } from '@features/user/services/user';
import { AddonBadgesUserBadge } from '@addons/badges/services/badges';

type StatisticItem = {
    id: string;
    title: string;
    value: string|number;
    icon: string;
    color: string;
};

type MatrixBoxes = {
    title: string;
    value: string|number;
    percentage: string|number;
    percentage_int: number;
    color: string;
};

type Certificate = {
    code: string;
    pathnamehash: string;
    name: string;
    fullname: string;
    shortname: string;
    downloadurl: string;
    imageurl: string;
};

/**
 * Page that displays site home index.
 */
@Component({
    selector: 'page-core-sitehome-index',
    templateUrl: 'index.html',
    styleUrls: ['index.scss'],
})
export class CoreSiteHomeIndexPage implements OnInit, OnDestroy, OnDestroy {

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

    protected preSets: CoreSiteWSPreSets;

    currentUserId: number;

    sliders: string | null = null;

    cacheKeys = {
        sliders: ':theme_slideshows',
        statistics: ':statistics',
        matrixBoxes: ':matrixBoxes',
        badges: ':badges',
        certificates: ':certificates',
    };

    recommendedCourses: [] = [];

    myPrograms: [] = [];
    myCourses: [] = [];

    statuses = [
        {
            label: 'All Courses',
            value: '0',
        },
        {
            label: 'To Do',
            value: 'todo',
        },
        {
            label: 'Completed',
            value: 'completed',
        },
    ];

    certificates: Certificate[] = [];

    statistics: StatisticItem[] = [
        {
            id: 'badges',
            title: 'Badges',
            value: 0,
            icon: 'fas-trophy',
            color: '#00bbf9',
        },
        {
            id: 'coursecompleted',
            title: 'Course Completed',
            value: 0,
            icon: 'fas-book',
            color: '#6a994e',
        },
        {
            id: 'certificates',
            title: 'Certificates',
            value: 0,
            icon: 'fas-certificate',
            color: '#4361ee',
        },
        {
            id: 'programscompleted',
            title: 'Programs Completed',
            value: 0,
            icon: 'fas-graduation-cap',
            color: '#bc4749',
        },
    ];

    matrixBoxes: MatrixBoxes[] = [
        {
            title: 'To do',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#0072BC',
        },
        {
            title: 'Overdue',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#E74C31',
        },
        {
            title: 'Completed',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#17C167',
        },
    ];

    badges: AddonBadgesUserBadge[] = [];

    timeSpent = '0 hours';

    user?: CoreUserProfile;

    thisMonthYear = new Date().toLocaleString('en-us', { month: 'long', year: 'numeric' });

    lastFetchedAt: Date|null = null;

    fetchInterval: NodeJS.Timeout|null = null;

    constructor() {
        // Refresh the enabled flags if site is updated.
        this.updateSiteObserver = CoreEvents.on(CoreEvents.SITE_UPDATED, () => {
            this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();
        }, CoreSites.getCurrentSiteId());

        this.currentUserId = CoreSites.getCurrentSiteUserId();

        this.preSets = {
            cacheKey: 'CustomSiteHome',
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            component: 'customsitehome',
            componentId: this.siteHomeId,
            getFromCache: true,
            saveToCache: false,
        };
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();

        this.currentSite = CoreSites.getRequiredCurrentSite();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();

        try {
            this.user = await CoreUser.getProfile(this.currentUserId);
        } catch {
            this.user = {
                id: this.currentUserId,
                fullname: 'User',
            };
        }

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

            // Refresh the data periodically.
            this.fetchInterval = setInterval(() => {
                this.loadCounts();
            }, 10 * 1000);
        });
    }

    /**
     * @inheritdoc
     */
    loadCounts(): void {
        this.lastFetchedAt = new Date();

        this.fetchStatistics();
        this.fetchMatrixBoxes();
        this.fetchBadges();
        this.fetchCertificates();
    }

    /**
     * Convenience function to fetch the data.
     *
     * @returns Promise resolved when done.
     */
    protected async loadContent(): Promise<void> {
        try {
            this.getSliders();
            this.loadCounts();
            this.fetchRecommendedCourses();
            this.fetchMyPrograms();
            this.fetchMyCourses('0');

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

        // invalidate all caches.
        Object.keys(this.cacheKeys).forEach((key) => {
            this.currentSite.invalidateWsCacheForKey(this.preSets.cacheKey + ':' + this.cacheKeys[key]);
        });

        Promise.all(promises).finally(async () => {
            await this.loadContent().finally(() => {
                refresher?.complete();
            });
        });
    }

    /**
     * Get sliders
     */
    protected getSliders(): void {
        this.currentSite.read<string>(
            'local_collab_function_get_sliders',
            {},
            this.buildPreset(this.cacheKeys.sliders),
        ).then((data) => {
            this.sliders = data['html'];

            return this.sliders;
        }).catch(() => {
            // Ignore errors.
        });
    }

    sliderClicked(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const target = event.target as HTMLAnchorElement;
        const href = target.href;

        if(!href || href === '#') {
            return;
        }

        const whitelistedDomains = [
            window.location.origin,
            this.currentSite.getURL(),
        ];

        const url = new URL(href);

        if (!whitelistedDomains.includes(url.origin)) {
            CoreUtils.openInBrowser(href);

            return;
        }

        switch (url.pathname) {
            case '/course/view.php': {
                const courseId = url.searchParams.get('id');

                if (courseId) {
                    CoreNavigator.navigateToSitePath(`/course/${courseId}/summary`);
                }
                break;
            }
            case '/local/course_catalogue/index.php':
            case '/local/course_catalogue':
            case '/local/course_catalogue/':
            case '/course/index.php':
            case '/course':
            case '/course/': {
                CoreNavigator.navigateToSitePath('catalogue');
                break;
            }
            case '/local/course_catalogue/my.php':
            case '/local/course_catalogue/my.php/': {
                CoreNavigator.navigateToSitePath('mytrainings');
                break;
            }
            case '/local/course_catalogue/shorts.php':
            case '/local/course_catalogue/shorts.php/': {
                CoreNavigator.navigateToSitePath('shorts');
                break;
            }
            default:
                CoreUtils.openInBrowser(href);
                break;
        }
    }

    navigate(path: string, params?: Params): void {
        CoreNavigator.navigateToSitePath(path, { params });
    }

    /**
     * Fetch the statistics.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchStatistics(): Promise<void> {
        this.currentSite.read('block_user_intro_get_statistics', {
        }, this.buildPreset(this.cacheKeys.statistics)).then((data: StatisticItem[]) => {
            let statistics = data.map((statistic) => ({
                ...statistic,
                icon: statistic.icon.replace('fa fa-', 'fas-'),
            }));

            // get time spent.
            this.timeSpent = statistics.find((statistic) => statistic.id === 'timespent')?.value as string;

            // popout time spent.
            statistics = statistics.filter((statistic) => statistic.id !== 'timespent');

            this.statistics = statistics;

            return this.statistics;

        }).catch(() => {
            // Ignore errors.
        });
    }

    /**
     * Fetch the matrix boxes.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMatrixBoxes(): Promise<void> {
        this.currentSite.read('block_user_intro_get_trainingmatrices', {
        }, this.buildPreset(this.cacheKeys.matrixBoxes)).then((data: MatrixBoxes[] ) => {
            this.matrixBoxes = data || [];

            return;
        }).catch(() => {
            this.matrixBoxes = [];
        });
    }

    /**
     * Fetch the recommended courses.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchRecommendedCourses(): Promise<void> {
        this.currentSite.read('local_course_catalogue_get_recommended_courses', {})
            .then((data: { courses: [] }) => {
                this.recommendedCourses = data.courses || [];

                return;
            }).catch(() => {
                this.recommendedCourses = [];
            });
    }

    /**
     * Fetch the my programs.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMyPrograms(): Promise<void> {
        this.currentSite.read('local_course_catalogue_get_my', {
            filters: {
                learning_type: 'program',
            },
        }).then((data: { programs: [] }) => {
            this.myPrograms = data.programs || [];

            return;
        }).catch(() => {
            this.myPrograms = [];
        });
    }

    /**
     * Fetch the my courses.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMyCourses(status: string): Promise<void> {
        this.currentSite.read('local_course_catalogue_get_my', {
            filters: {
                learning_type: 'course',
                status,
                sort: 'latest',
            },
        }).then((data: { courses: [] }) => {
            this.myCourses = data.courses || [];

            return;
        }).catch(() => {
            this.myCourses = [];
        });
    }

    /**
     * Fetch the badges.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchBadges(): Promise<void> {
        this.currentSite.read(
            'core_badges_get_user_badges',
            {
                userid: this.currentUserId,
                courseid: 0,
            },
            this.buildPreset(this.cacheKeys.badges),
        ).then((data: { badges: AddonBadgesUserBadge[] }) => {
            this.badges = data.badges || [];

            return;
        }).catch(() => {
            this.badges = [];
        });
    }

    /**
     * Fetch the certificates.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchCertificates(): Promise<void> {
        this.currentSite.read(
            'block_mycertificates_get_data',
            {},
            this.buildPreset(this.cacheKeys.certificates),
        ).then((data: Certificate[]) => {
            this.certificates = data || [];

            return;
        }).catch(() => {
            this.certificates = [];
        });
    }

    goToBadges(uniquehash: string | null = null): void {
        if (uniquehash) {
            CoreNavigator.navigateToSitePath('badges/' + uniquehash, { params: { userId: this.currentUserId, courseId: 0 } });

            return;
        }

        CoreNavigator.navigateToSitePath('badges', { params: { userId: this.currentUserId } });
    }

    downloadCertificate(certificate: Certificate): void {
        CoreUtils.openFile(certificate.downloadurl);
    }

    // #region unused

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

    // #endregion unused

    /**
     * Build a common preset of WS options for all the requests.
     *
     * @param key Cache key to use.
     * @param frequency Update frequency.
     * @returns CoreSiteWSPreSets
     */
    protected buildPreset(key: string, frequency?: number | undefined): CoreSiteWSPreSets {
        const newKey = this.preSets.cacheKey + ':' + key;

        return {
            ...this.preSets,
            cacheKey: newKey,
            updateFrequency: frequency || this.preSets.updateFrequency,
            saveToCache: false,
        };
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.updateSiteObserver.off();

        this.fetchInterval && clearInterval(this.fetchInterval);
    }

    triggerchange(event: CustomEvent): void {
        this.fetchMyCourses(event.detail.value).finally(() => {
            // Scroll #mycourses-block to beginning. #mycourses-block is horizontal scrollable.
            const myCoursesBlock = document.getElementById('mycourses-block');
            myCoursesBlock?.scrollTo({ left: 0, behavior: 'smooth' });
        });
    }

}
