import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { vi } from 'vitest';

export interface UserStub {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAdmin?: boolean;
  username?: string;
}

export interface FirebaseServiceStub {
  auth: unknown;
  fs: unknown;
  user$: () => Observable<UserStub | null>;
  authState$: () => Observable<UserStub | null>;
  docData$: (ref: unknown) => Observable<any>;
  collectionData$: (ref: unknown, idField?: string) => Observable<any[]>;
  _user: BehaviorSubject<UserStub | null>;
  _authState: BehaviorSubject<UserStub | null>;
  _docData: BehaviorSubject<any>;
  _collectionData: BehaviorSubject<any[]>;
}

export function createFirebaseServiceStub(): FirebaseServiceStub {
  const user = new BehaviorSubject<UserStub | null>(null);
  const authState = new BehaviorSubject<UserStub | null>(null);
  const docData = new BehaviorSubject<any>(undefined);
  const collectionData = new BehaviorSubject<any[]>([]);
  return {
    auth: {},
    fs: {},
    user$: vi.fn(() => user.asObservable()),
    authState$: vi.fn(() => authState.asObservable()),
    docData$: vi.fn(() => docData.asObservable()),
    collectionData$: vi.fn(() => collectionData.asObservable()),
    _user: user,
    _authState: authState,
    _docData: docData,
    _collectionData: collectionData,
  };
}

export function createRouterStub() {
  return {
    navigate: vi.fn(async () => true),
    navigateByUrl: vi.fn(async () => true),
    events: new Subject(),
    routerState: { snapshot: {} },
    url: '/',
  };
}

export function createNotificationServiceStub() {
  return {
    show: vi.fn(
      (_message: string, _type?: string, _duration?: number) => undefined,
    ),
    dismiss: vi.fn((_id: number) => undefined),
    messages$: new BehaviorSubject<any[]>([]).asObservable(),
  };
}

export function createHlmDialogServiceStub() {
  return {
    open: vi.fn((_component: any, _options?: any) => undefined),
  };
}

export function createBrnDialogRefStub() {
  return { close: vi.fn((_result?: unknown) => undefined) };
}

export function createSettingsServiceStub() {
  const settingsSubject = new BehaviorSubject<any>(null);
  return {
    settings$: settingsSubject.asObservable(),
    current: {} as any,
    format: vi.fn((_value: number) => ''),
    formatNumber: vi.fn((_value: number, _numberFormat: string) => ''),
    updateCurrency: vi.fn((_currency: string) => undefined),
    updateNumberFormat: vi.fn((_numberFormat: string) => undefined),
    updateNotifications: vi.fn(
      (_email: boolean, _push: boolean) => undefined,
    ),
    _settings: settingsSubject,
  };
}

export function createTagServiceStub() {
  const incomeTags = new BehaviorSubject<any[]>([]);
  const expenseTags = new BehaviorSubject<any[]>([]);
  return {
    incomeTags$: incomeTags.asObservable(),
    expenseTags$: expenseTags.asObservable(),
    getTagFromId: vi.fn(
      (_tagId: string, _type: string) =>
        new BehaviorSubject<any>(null).asObservable(),
    ),
    synchronousGetTagFromId: vi.fn((_tagId: string, _type: string) => ({})),
    separateTagsByType: vi.fn((_tags: any[]) => undefined),
    getTags: vi.fn(() => new BehaviorSubject<any[]>([]).asObservable()),
    addTag: vi.fn(
      (_tag: string, _type: string) =>
        new BehaviorSubject<string>('').asObservable(),
    ),
    updateTag: vi.fn(
      (_tagId: string, _updates: any) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    deleteTag: vi.fn(
      (_tagId: string) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    addTagToTransaction: vi.fn(
      (_transactionId: string, _tagId: string, _transactionType: string) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    removeTagFromTransaction: vi.fn(
      (_transactionId: string, _tagId: string, _transactionType: string) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    getTagsForTransaction: vi.fn(
      (_transactionId: string, _transactionType: string) =>
        new BehaviorSubject<any[]>([]).asObservable(),
    ),
    getTransactionsByTag: vi.fn(
      (_tagId: string, _transactionType: string) =>
        new BehaviorSubject<any[]>([]).asObservable(),
    ),
    _incomeTags: incomeTags,
    _expenseTags: expenseTags,
  };
}

export function createTransactionServiceStub() {
  const income = new BehaviorSubject<any[]>([]);
  const expense = new BehaviorSubject<any[]>([]);
  return {
    userId: null,
    incomeTransactions$: income.asObservable(),
    expenseTransactions$: expense.asObservable(),
    initialize: vi.fn(() => undefined),
    getTransactionFromId: vi.fn(
      (_transactionId: string, _type: string) => undefined,
    ),
    getAllTransactions: vi.fn(() =>
      new BehaviorSubject({
        incomeTransactions: [],
        expenseTransactions: [],
      }).asObservable(),
    ),
    getTransactions: vi.fn(
      (_transactionType: string) =>
        new BehaviorSubject<any[]>([]).asObservable(),
    ),
    getIncomeTransactions: vi.fn(
      () => new BehaviorSubject<any[]>([]).asObservable(),
    ),
    getExpenseTransactions: vi.fn(
      () => new BehaviorSubject<any[]>([]).asObservable(),
    ),
    addTransaction: vi.fn(
      (_transaction: any) =>
        new BehaviorSubject(Promise.resolve()).asObservable(),
    ),
    updateTransaction: vi.fn(
      (_id: string, _transaction: any) =>
        new BehaviorSubject(Promise.resolve()).asObservable(),
    ),
    deleteTransaction: vi.fn(
      (_transaction: any) =>
        new BehaviorSubject(Promise.resolve()).asObservable(),
    ),
    _income: income,
    _expense: expense,
  };
}

export function createAuthServiceStub() {
  const currentUser = new BehaviorSubject<any>(null);
  return {
    user$: new BehaviorSubject<any>(null).asObservable(),
    currentUser$: currentUser.asObservable(),
    initializeUserState: vi.fn(() => undefined),
    register: vi.fn(
      (_email: string, _password: string, _username: string) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    login: vi.fn(
      (_email: string, _password: string) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
    logout: vi.fn(() => undefined),
    googleSignIn: vi.fn(async () => undefined),
    facebookSignIn: vi.fn(async () => undefined),
    isAdmin: vi.fn(() => new BehaviorSubject(false).asObservable()),
    setAdminStatus: vi.fn(async (_uid: string, _isAdmin: boolean) => undefined),
    getAllUsers: vi.fn(() => new BehaviorSubject<any[]>([]).asObservable()),
    _currentUser: currentUser,
  };
}

export function createPdfServiceStub() {
  return {
    pdfs$: new BehaviorSubject<any[]>([]).asObservable(),
    uploadPdf: vi.fn(
      (_file: any) => new BehaviorSubject<any>(null).asObservable(),
    ),
    getAllPdfs: vi.fn(() => new BehaviorSubject<any[]>([]).asObservable()),
    getDownloadUrl: vi.fn(
      (_fileId: string) =>
        new BehaviorSubject({ downloadUrl: '' }).asObservable(),
    ),
    deletePdf: vi.fn(
      (_pdfFile: any) =>
        new BehaviorSubject<void>(undefined).asObservable(),
    ),
  };
}

export function createUtilServiceStub() {
  return {
    formatAmount: vi.fn((_value: number) => ''),
    formatDateToDayMonthYearWeekday: vi.fn((_date: Date) => ''),
    moneyToLineBarData: vi.fn((_money: any[]) => []),
    dateToMilli: vi.fn((_date: string) => 0),
    milliToDate: vi.fn((_milli: number) => ''),
    dateToMonthDateYearDay: vi.fn(
      (_date: string, _showDay?: boolean) => '',
    ),
    groupLineBarDataByDay: vi.fn((_data: any[]) => []),
    groupBarDataByMonth: vi.fn((_data: any) => undefined),
    groupPointsByTags: vi.fn((_points: any[]) => ({})),
    formatTooltipBySortedPoints: vi.fn(
      (_sortedPointsByTags: any, _isIncome?: boolean) => '',
    ),
  };
}

export const AUTH_TOKEN_VALUE = { mock: 'auth' };
export const FIRESTORE_TOKEN_VALUE = { mock: 'firestore' };
