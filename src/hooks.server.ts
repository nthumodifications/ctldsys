import { PB_URL, PB_USER, PB_PASS, RS_KEY } from '$env/static/private';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { redirect } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { Resend } from 'resend';

Sentry.init({
  environment: 'development',
  dsn: "https://06fd9630d486ad4f3c5f8817673cde5e@o4506077215064064.ingest.sentry.io/4506103781130240",
  tracesSampleRate: 1
})

export const handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {

  event.locals.rs = new Resend(RS_KEY);
  event.locals.pb = new PocketBase(PB_URL);
  
  const token = event.request.headers.get('cookie')
  event.locals.pb.authStore.loadFromCookie(token || '');

  try {
    if(event.locals.pb.authStore.isValid) {
      await event.locals.pb.collection('users').authRefresh()
      event.locals.user = event.locals.pb.authStore.model
    }
  }

  catch (_) {
    event.locals.pb.authStore.clear();
    event.locals.user = undefined
  }

  if(!event.locals.user && event.url.pathname != '/auth' && event.url.pathname != '/') {
    throw redirect(307, '/auth?r='+event.url.pathname)
  }

  if(event.locals.user && event.locals.user.admin == false && event.url.pathname.startsWith('/admin')) {
    throw redirect(302, '/dashboard')
  }

  if(event.locals.user) {
    try {
      event.locals.adminpb = new PocketBase(PB_URL)    
      await event.locals.adminpb.admins.authWithPassword(PB_USER, PB_PASS);
    }
    catch (_) {
      event.locals.adminpb = undefined
    }
  }

  const response = await resolve(event);

  response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie({ secure: false }));
  return response;

});
export const handleError = Sentry.handleErrorWithSentry();