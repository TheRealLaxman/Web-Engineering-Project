import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '../api/users.js'

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: (created) => {
      // JSONPlaceholder doesn't persist, so patch the cache; with a real API use invalidateQueries.
      qc.setQueryData(['users'], (old = []) => [...old, created])
      // qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
