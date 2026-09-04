import {
  canonicalizeRouteSearch,
  type SearchParser,
} from '@/shared/lib/search';
import { redirect } from '@tanstack/react-router';

export function canonicalSearchGuard<
  TSearch extends Record<string, unknown>,
>(schema: SearchParser<TSearch>): (args: {
  location: {
    readonly pathname: string;
    readonly search: unknown;
  };
}) => void {
  return ({
    location,
  }): void => {
    const canonical = canonicalizeRouteSearch(schema, location.search);
    if (canonical.changed) {
      redirect({
        to: location.pathname,
        search: () => canonical.search,
        replace: true,
        throw: true,
      });
    }
  };
}
