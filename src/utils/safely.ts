import { useToastStore } from '../store/useToastStore'

/**
 * Runs a save/write action and turns any failure (IndexedDB quota, blocked storage, bad data) into a
 * friendly toast instead of an unhandled rejection. The raw error is still logged in development.
 * Returns true when the action succeeded.
 */
export async function safely(action: () => Promise<unknown>, message = "We couldn't save this entry. Please try again."): Promise<boolean> {
  try {
    await action()
    return true
  } catch (error) {
    if (import.meta.env.DEV) console.error(error)
    useToastStore.getState().show(message)
    return false
  }
}
