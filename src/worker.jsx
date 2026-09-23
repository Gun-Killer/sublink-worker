import { createApp } from './app/createApp.jsx';
import { createCloudflareRuntime } from './runtime/cloudflare.js';

let honoApp;

function getApp(env) {
    if (!honoApp) {
        const runtime = createCloudflareRuntime(env);
        honoApp = createApp(runtime);
    }
    return honoApp;
}

function checkToken(request, env) {
    const url = new URL(request.url);

    // 支持 ?token=xxx
    const token = url.searchParams.get('token');

    // 也支持 Authorization: Bearer xxx
    const auth = request.headers.get('Authorization');
    const bearerToken =
        auth?.startsWith('Bearer ')
            ? auth.slice(7)
            : null;

    const suppliedToken = token || bearerToken;

    if (!env.SUBLINK_TOKEN) {
        return new Response(
            'SUBLINK_TOKEN is not configured',
            { status: 500 }
        );
    }

    if (!suppliedToken || suppliedToken !== env.SUBLINK_TOKEN) {
        return new Response(
            'Unauthorized',
            {
                status: 401,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store'
                }
            }
        );
    }

    return null;
}

export default {
    async fetch(request, env, ctx) {
        const authError = checkToken(request, env);

        if (authError) {
            return authError;
        }

        const app = getApp(env);

        return app.fetch(request, env, ctx);
    }
};
