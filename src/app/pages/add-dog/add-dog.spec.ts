import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDog } from './add-dog';

describe('AddDog', () => {
  let component: AddDog;
  let fixture: ComponentFixture<AddDog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
