import { finderIndex } from '@/lib/finder-index'

// Written once at build time as a static file, the same for every language: the court finder
// on /<locale>/jurisdiction/ loads it
export const dynamic = 'force-static'

export function GET() {
    return Response.json(finderIndex())
}
