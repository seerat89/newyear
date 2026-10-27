/** Starts one of the motion system's named behaviours (jump, lookout, glide ...). */
export const omidBehave = (name: string) =>
  window.dispatchEvent(new CustomEvent('omid-behave', { detail: name }))
