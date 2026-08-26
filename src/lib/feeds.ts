import { supabase } from './supabase'

export interface FeedModule {
  id: string
  title: string
  description: string
}

/** Publicerade moduler i visningsordning. */
export async function fetchModules(): Promise<FeedModule[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, title, description')
    .eq('published', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

const FEED_BASE = (import.meta.env.VITE_FEED_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** https-URL till feeden för en eller flera moduler. */
export function feedUrl(moduleIds: string[]): string {
  if (moduleIds.length === 1) return `${FEED_BASE}/${moduleIds[0]}`
  return `${FEED_BASE}?modules=${moduleIds.join(',')}`
}

/** webcal:// för ett-klicks-prenumeration i kalenderappar. */
export function webcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https?:\/\//, 'webcal://')
}
