# Type-safe Next Routing

Utility to make next.js routing type safe. Based on https://www.flightcontrol.dev/blog/fix-nextjs-routing-to-have-full-type-safety. The project is initiated with [typescript-starter](https://github.com/bitjson/typescript-starter).

## Installation

```
npm i next-type-safe-routing
```

## Usage

```typescript
import { z } from 'zod';

export const OrgParams = z.object({ orgId: z.string() });

export const Routes = {
  home: makeRoute(({ orgId }) => `/org/${orgId}`, OrgParams),
};
```

```typescript
import Link from 'next/link'
import {Routes} from '../../routes.ts'

<Link href={Routes.home({orgId: 'g4eion3e3'})} />
```

## Developing

- `npm run watch:build`
- To test: `npm run test`
