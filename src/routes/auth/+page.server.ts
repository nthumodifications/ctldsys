import { redirect, fail } from '@sveltejs/kit';

export const actions = {
  default: async ({ locals, request }) => {
    const data = await request.formData();
    const user = data.get('user')
    const pass = data.get('pass')

    try {
      await locals.pb.collection('users').authWithPassword(user, pass)
      throw redirect(302, '/dashboard')
    }
    catch (err) {
      if(err?.status == 302){
        throw redirect(302, '/dashboard')
      }
      return fail(400, true);
    }

  },
};