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
import { CoreSiteInfo } from '@classes/site';
import { CoreUserTourDirectiveOptions } from '@directives/user-tour';
import { CoreUserToursAlignment, CoreUserToursSide } from '@features/usertours/services/user-tours';
import { IonRouterOutlet } from '@ionic/angular';
import { CoreScreen } from '@services/screen';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreMainMenuUserMenuTourComponent } from '../user-menu-tour/user-menu-tour';
import { CoreMainMenuUserMenuComponent } from '../user-menu/user-menu';
import { CoreNavigator } from '@services/navigator';
import { CorePushNotificationsDelegate } from '@features/pushnotifications/services/push-delegate';
import { CoreUtils } from '@services/utils/utils';
import { CoreEvents } from '@singletons/events';
import { AddonNotifications, AddonNotificationsProvider } from '@addons/notifications/services/notifications';

/**
 * Component to display an avatar on the header to open user menu.
 *
 * Example: <core-user-menu-button></core-user-menu-button>
 */
@Component({
    selector: 'core-user-menu-button',
    templateUrl: 'user-menu-button.html',
    styleUrls: ['user-menu-button.scss'],
})
export class CoreMainMenuUserButtonComponent implements OnInit {

    @Input() alwaysShow = false;
    siteInfo?: CoreSiteInfo;
    isMainScreen = false;
    userTour: CoreUserTourDirectiveOptions = {
        id: 'user-menu',
        component: CoreMainMenuUserMenuTourComponent,
        alignment: CoreUserToursAlignment.Start,
        side: CoreScreen.isMobile ? CoreUserToursSide.Start : CoreUserToursSide.End,
    };

    notificationCount = '';

    constructor(protected routerOutlet: IonRouterOutlet) {
        const currentSite = CoreSites.getRequiredCurrentSite();

        this.siteInfo = currentSite.getInfo();
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.isMainScreen = !this.routerOutlet.canGoBack();

        this.initializeNotifyCount();
    }

    /**
     * Open User menu
     *
     * @param event Click event.
     */
    openUserMenu(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        CoreDomUtils.openSideModal<void>({
            component: CoreMainMenuUserMenuComponent,
        });
    }

    /**
     * Open search page
     *
     */
    openSearch(): void {
        // CoreNavigator.navigateToSitePath('courses/list', { params : { mode: 'search' } });
        CoreNavigator.navigateToSitePath('global-search');
    }

    openNotifications(): void {
        CoreNavigator.navigateToSitePath('notifications');
    }

    /**
     * Initialize the handler.
     */
    initializeNotifyCount(): void {
        CoreEvents.on(AddonNotificationsProvider.READ_CHANGED_EVENT, (data) => {
            this.updateBadge(data.siteId);
        });

        CoreEvents.on(AddonNotificationsProvider.READ_CRON_EVENT, (data) => {
            this.updateBadge(data.siteId);
        });

        // Reset info on logout.
        CoreEvents.on(CoreEvents.LOGOUT, () => {
            this.notificationCount = '';
        });

        // If a push notification is received, refresh the count.
        CorePushNotificationsDelegate.on('receive').subscribe((notification) => {
            // New notification received. If it's from current site, refresh the data.
            if (CoreUtils.isTrueOrOne(notification.notif) && CoreSites.isCurrentSite(notification.site)) {
                this.updateBadge(notification.site);
            }
        });

        this.updateBadge();
    }

    /**
     * Triggers an update for the badge number and loading status. Mandatory if showBadge is enabled.
     *
     * @param siteId Site ID or current Site if undefined.
     * @returns Promise resolved when done.
     */
    protected async updateBadge(siteId?: string): Promise<void> {
        siteId = siteId || CoreSites.getCurrentSiteId();
        if (!siteId) {
            return;
        }

        try {
            const unreadCountData = await AddonNotifications.getUnreadNotificationsCount(undefined, siteId);

            this.notificationCount = unreadCountData.count > 0
                ? unreadCountData.count + (unreadCountData.hasMore ? '+' : '')
                : '';

            // CorePushNotifications.updateAddonCounter(AddonNotificationsMainMenuHandlerService.name,
            // unreadCountData.count, siteId);

            // CoreEvents.trigger(
            //     CoreMainMenuProvider.MAIN_MENU_HANDLER_BADGE_UPDATED,
            //     {
            //         handler: AddonNotificationsMainMenuHandlerService.name,
            //         value: unreadCountData.count,
            //     },
            //     siteId,
            // );
        } catch {
            this.notificationCount = '';
        }
    }

}
