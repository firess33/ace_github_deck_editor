import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TierEditorComponent } from './tier-editor.component';

describe('TierEditorComponent', () => {
  let component: TierEditorComponent;
  let fixture: ComponentFixture<TierEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TierEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TierEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
