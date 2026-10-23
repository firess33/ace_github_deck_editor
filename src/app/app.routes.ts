import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component'; // 請根據你實際的資料夾路徑調整
import { TierEditorComponent } from './tier-editor/tier-editor.component';
export const routes: Routes = [

      { path: 'ace_github_deck_editor', component: IndexComponent },
       { path: 'tier_editor', component: TierEditorComponent },
      { path: '', redirectTo: 'ace_github_deck_editor', pathMatch: 'full' },

];
