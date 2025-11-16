import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { google } from 'googleapis'

// Create the Hono app
const app = new Hono()
  .use('/*', cors())
  .use('*', clerkMiddleware())

  // Health check
  .get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // GET /api/events - Get Google Calendar events from past month
  .get('/api/events', async (c) => {
    const auth = getAuth(c)

    if (!auth?.userId) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to view events.'
        },
        401
      )
    }

    try {
      // Get the Clerk client
      const clerkClient = c.get('clerk')

      // Get user to find Google account ID
      const user = await clerkClient.users.getUser(auth.userId)

      // Find the Google OAuth account
      const googleAccount = user.externalAccounts.find(
        (account) => account.provider === 'oauth_google'
      )

      if (!googleAccount) {
        return c.json(
          {
            error: 'Not Connected',
            message: 'Please connect your Google account to view calendar events.'
          },
          403
        )
      }

      // Get the OAuth access token for Google
      const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
        auth.userId,
        'oauth_google'
      )

      if (!tokenResponse.data || tokenResponse.data.length === 0) {
        return c.json(
          {
            error: 'No Token',
            message: 'Unable to get Google access token. Please reconnect your Google account.'
          },
          403
        )
      }

      const accessToken = tokenResponse.data[0].token

      // Set up Google Calendar API client
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: accessToken })

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      // Calculate date range (past month)
      const now = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(now.getMonth() - 1)

      // Fetch calendar events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: oneMonthAgo.toISOString(),
        timeMax: now.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      })

      const events = response.data.items?.map((event) => ({
        id: event.id || '',
        name: event.summary || 'Untitled Event',
        date: event.start?.dateTime || event.start?.date || '',
        description: event.description || '',
        location: event.location || ''
      })) || []

      return c.json(events)
    } catch (error) {
      console.error('Error fetching calendar events:', error)

      // Log more details for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any
        console.error('API Error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        })
      }

      return c.json(
        {
          error: 'Failed to fetch calendar events',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: process.env.NODE_ENV === 'development'
            ? (error && typeof error === 'object' && 'response' in error
                ? (error as any).response?.data
                : undefined)
            : undefined
        },
        500
      )
    }
  })

// Export the app type for RPC client
export type AppType = typeof app

// Start the server
const port = 3000
console.log(`🚀 Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app
