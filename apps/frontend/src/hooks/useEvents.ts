import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/api'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await client.api.events.$get()
      if (!res.ok) {
        throw new Error('Failed to fetch events')
      }
      return res.json()
    }
  })
}
