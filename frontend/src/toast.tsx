import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'

export const successToast = (message = 'Successfully created!') => toast.success(message)
export const errorToast = (message = 'Something went wrong. Please try again.') => toast.error(message)

export default function Toast() {
  return <Toaster position="top-right" />
}