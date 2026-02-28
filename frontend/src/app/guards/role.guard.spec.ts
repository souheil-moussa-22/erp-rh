import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { roleGuard, hrRoleGuard } from './role.guard';

describe('roleGuard', () => {
  const executeGuard: CanActivateFn = roleGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeDefined();
  });
});

describe('hrRoleGuard', () => {
  const executeGuard: CanActivateFn = hrRoleGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeDefined();
  });
});
