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

import { APP_INITIALIZER, NgModule, Type } from '@angular/core';
import { Routes } from '@angular/router';
import { CoreCourseIndexRoutingModule } from '@features/course/course-routing.module';
import { CoreMainMenuRoutingModule } from '@features/mainmenu/mainmenu-routing.module';
import { CoreMainMenuTabRoutingModule } from '@features/mainmenu/mainmenu-tab-routing.module';
import { CoreMainMenuDelegate } from '@features/mainmenu/services/mainmenu-delegate';
import { AddonShortsProvider } from './services/shorts';
import { AddonShortsMainMenuHandler, AddonShortsMainMenuHandlerService } from './services/handlers/mainmenu';
import { AddonShortsUploadPage } from './pages/upload/upload';
import { AddonShortsSinglePage } from './pages/single/single';
import { AddonCertificateUploadPage } from './pages/uploadcert/uploadcert';

export const ADDON_DASHBOARD_SERVICES: Type<unknown>[] = [
    AddonShortsProvider,
];

const routes: Routes = [
    {
        path: AddonShortsMainMenuHandlerService.PAGE_NAME,
        loadChildren: () => import('./shorts-lazy.module').then(m => m.AddonShortsLazyModule),
    },
    {
        path: AddonShortsMainMenuHandlerService.PAGE_NAME + '/upload',
        component: AddonShortsUploadPage,
    },
    {
        path: AddonShortsMainMenuHandlerService.PAGE_NAME + '/short/:shortId',
        component: AddonShortsSinglePage,
    },
    {
        path: AddonShortsMainMenuHandlerService.PAGE_NAME + '/upload-external-certificate',
        component: AddonCertificateUploadPage,
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(routes),
        CoreMainMenuRoutingModule.forChild({ children: routes }),
        CoreCourseIndexRoutingModule.forChild({ children: routes }),
    ],
    exports: [CoreMainMenuRoutingModule],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            useValue: () => {
                CoreMainMenuDelegate.registerHandler(AddonShortsMainMenuHandler.instance);
            },
        },
    ],
})
export class AddonShortsModule {}
