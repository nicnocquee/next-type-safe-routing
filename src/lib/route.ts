import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { z } from 'zod';

type RouteBuilder<Params extends z.ZodSchema, Search extends z.ZodSchema> = {
  (
    p?: z.input<Params>,
    options?: { readonly search?: z.input<Search> },
  ): string;
  readonly useParams: () => z.output<Params>;
  readonly useSearchParams: () => z.output<Search>;
  readonly params: z.output<Params>;
};

export function makeRoute<
  Params extends z.ZodSchema,
  Search extends z.ZodSchema,
>(
  fn: (p: z.input<Params>) => string,
  paramsSchema: Params = z.object({}) as unknown as Params,
  search: Search = z.object({}) as unknown as Search,
): RouteBuilder<Params, Search> {
  const routeBuilder = Object.assign(
    (
      params?: z.input<Params>,
      options?: { readonly search?: z.input<Search> },
    ): string => {
      const paramsValidationResult = paramsSchema.safeParse(params ?? {});
      if (!paramsValidationResult.success) {
        throw new Error(
          `Invalid route params: ${paramsValidationResult.error.message}`,
        );
      }
      const searchString = options?.search
        ? new URLSearchParams(options.search)
        : null;
      const searchParamsValidationResult = search.safeParse(
        convertURLSearchParamsToObject(searchString),
      );
      if (!searchParamsValidationResult.success) {
        throw new Error(
          `Invalid search params: ${searchParamsValidationResult.error.message}`,
        );
      }
      const baseUrl = fn(params);

      return [baseUrl, searchString ? `?${searchString.toString()}` : ''].join(
        '',
      );
    },
    {
      useParams: function useParams(): z.output<Params> {
        const res = paramsSchema.safeParse(useNextParams());
        if (!res.success) {
          throw new Error(`Invalid route params: ${res.error.message}`);
        }
        return res.data;
      },
      useSearchParams: function useSearchParams(): z.output<Search> {
        const res = search.safeParse(
          convertURLSearchParamsToObject(useNextSearchParams()),
        );
        if (!res.success) {
          throw new Error(`Invalid search params: ${res.error.message}`);
        }
        return res.data;
      },
      params: {
        get() {
          // Replace the throw statement with functional error handling if needed
          console.warn(
            'Routes.[route].params is only for type usage, not runtime.',
          );
          return undefined; // Or handle accordingly
        },
        enumerable: true,
        configurable: false,
      },
    },
  );

  return routeBuilder;
}

export function convertURLSearchParamsToObject(
  params: URLSearchParams | null,
): Record<string, string | readonly string[]> {
  if (!params) {
    return {};
  }

  const obj: Record<string, string | readonly string[]> = Array.from(
    params.entries(),
  ).reduce(
    (accumulator, [key, value]) => {
      const allValues = params.getAll(key);
      // Return a new object instead of modifying the accumulator
      return {
        ...accumulator,
        [key]: allValues.length > 1 ? allValues : value,
      };
    },
    {} as Record<string, string | readonly string[]>,
  );

  return obj;
}
