import { HttpApi, type Api } from './api';
import { MockApi } from './mock/mock-api';
import { settings } from './settings';

/** The one API instance the whole app uses. */
export const api: Api = settings.useMockApi ? new MockApi() : new HttpApi();
