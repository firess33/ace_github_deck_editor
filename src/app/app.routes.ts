import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component'; // 請根據你實際的資料夾路徑調整
export const routes: Routes = [

      { path: 'ace_github_deck_editor', component: IndexComponent },
      { path: '', redirectTo: 'ace_github_deck_editor', pathMatch: 'full' },

];
