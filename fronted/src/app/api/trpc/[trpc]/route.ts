import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
export { handler as GET, handler as POST };

// looking at the other files, it seems like you are using trpc with react-query and suspense. The code above is the route handler for your trpc API endpoint. It uses the fetchRequestHandler from @trpc/server/adapters/fetch to handle incoming requests to the /api/trpc endpoint. The handler creates a context using createTRPCContext and routes the request to the appRouter, which contains all your trpc routers. This allows you to define your API endpoints in a type-safe manner and use them in your frontend components.