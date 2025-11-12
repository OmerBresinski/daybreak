import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { client } from '@/lib/api'

export function useEvents() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const token = await getToken()
      const res = await client.api.events.$get(
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (!res.ok) {
        throw new Error('Failed to fetch events')
      }
      return res.json()
    }
  })
}
