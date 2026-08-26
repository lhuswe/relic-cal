// Gemensamma svar-headers. Feeds hämtas ofta cross-origin (kalenderklienter, SPA:n),
// så GET tillåts brett. Ingen känslig data exponeras – bara publika feeds.
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export function calendarResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      // Klienter uppdaterar ~var 12:e timme; tillåt cachning en stund.
      'Cache-Control': 'public, max-age=21600',
    },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return new Response(message, {
    status,
    headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
