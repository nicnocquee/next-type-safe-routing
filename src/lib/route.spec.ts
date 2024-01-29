import test from 'ava';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import { z } from 'zod';

import { convertURLSearchParamsToObject } from './route';

// Disable proxyquire's call thru feature which, by default, would call the original method when not explicitly mocked
const noCallThru = { '@global': true, '@noCallThru': true };

// Setup your mocks
const useParamsMock = sinon.stub();
const useSearchParamsMock = sinon.stub();

// Proxyquire your module, replacing 'next/navigation' with your mocks
const routerBuilder = proxyquire('./route', {
  'next/navigation': {
    useParams: useParamsMock,
    useSearchParams: useSearchParamsMock,
    ...noCallThru,
  },
});

test.beforeEach((_t: any) => {
  // Reset mocks before each test if needed
  useParamsMock.reset();
  useSearchParamsMock.reset();
});

test.afterEach((_t: any) => {
  // Restore the original functions
  sinon.restore();
});

test('basic route without params', (t: any) => {
  const route = routerBuilder.makeRoute(() => `/about`);
  t.is(route(), '/about');
});

test('basic route with params', (t: any) => {
  const route = routerBuilder.makeRoute(
    (params: { id: any }) => `/items/${params.id}`,
    z.object({ id: z.string() }),
    z.object({}),
  );
  t.is(route({ id: '123' }), '/items/123');
});

test('basic route params throw error', (t: any) => {
  const route = routerBuilder.makeRoute(
    (params: { id: any }) => `/items/${params.id}`,
    z.object({ id: z.string() }),
    z.object({}),
  );
  const error = t.throws(() => route({}), { instanceOf: Error });
  t.regex(error.message, /Invalid route params/);
});

test('route with search parameters', (t: any) => {
  const route = routerBuilder.makeRoute(
    (params: { id: any }) => `/items/${params.id}`,
    z.object({ id: z.string() }),
    z.object({ query: z.string() }),
  );
  t.is(
    route({ id: '123' }, { search: { query: 'test' } }),
    '/items/123?query=test',
  );
});

test('invalid route params throw error', (t: any) => {
  useParamsMock.returns({ wrongParam: '123' });
  const route = routerBuilder.makeRoute(
    (params: { id: any }) => `/items/${params.id}`,
    z.object({ id: z.string() }),
    z.object({}),
  );

  const error = t.throws(() => route.useParams(), { instanceOf: Error });
  t.regex(error.message, /Invalid route params/);
});

test('invalid search params throw error', (t: any) => {
  useSearchParamsMock.returns(new URLSearchParams('wrongQuery=test'));
  const route = routerBuilder.makeRoute(
    (params: { id: any }) => `/items/${params.id}`,
    z.object({ id: z.string() }),
    z.object({ query: z.string() }),
  );

  const error = t.throws(() => route.useSearchParams(), { instanceOf: Error });
  t.regex(error.message, /Invalid search params/);
});

test('converts URLSearchParams to object', (t: any) => {
  const searchParams = new URLSearchParams('a=1&b=2&c=3&c=4');
  t.deepEqual(convertURLSearchParamsToObject(searchParams), {
    a: '1',
    b: '2',
    c: ['3', '4'],
  });
});
