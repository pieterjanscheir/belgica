import { describe, expect, it } from 'vitest'

import { isPublicUrl } from '../../scripts/sources/http.ts'

describe('isPublicUrl', () => {
    it('allows the public websites the sources are on', () => {
        expect(isPublicUrl('https://www.tribunaux-rechtbanken.be/nl')).toBe(true)
        expect(isPublicUrl('http://statbel.fgov.be/x')).toBe(true)
        expect(isPublicUrl('https://8.8.8.8/')).toBe(true)
    })

    it('refuses other schemes, and local and private hosts', () => {
        for (const url of [
            'file:///etc/passwd',
            'ftp://example.org/',
            'http://localhost:3000/',
            'http://127.0.0.1/',
            'http://169.254.169.254/latest/meta-data/',
            'http://10.0.0.1/',
            'http://172.16.0.1/',
            'http://192.168.1.1/',
            'http://[::1]/',
            'http://[fd00::1]/',
            'http://[::ffff:127.0.0.1]/',
        ])
            expect(isPublicUrl(url), url).toBe(false)
    })
})
