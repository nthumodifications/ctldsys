import { redirect } from '@sveltejs/kit'

export const load = ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/account/profile')
  }
}