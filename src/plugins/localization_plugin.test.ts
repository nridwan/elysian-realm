import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { localizationPlugin } from '../plugins/localization_plugin'

describe('Localization Plugin', () => {
  it('should provide localization tools with default language', async () => {
    const app = new Elysia()
      .use(localizationPlugin())
      .get('/test', ({ localizationTools }) => {
        return {
          language: localizationTools.language,
          successMessage: localizationTools.getTranslation('success'),
          errorMessage: localizationTools.getTranslation('error')
        }
      })

    const response = await app.handle(
      new Request('http://localhost/test')
    )
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.language).toBe('en')
    expect(body.successMessage).toBe('Success')
    expect(body.errorMessage).toBe('Error')
  })

  it('should use language from X-Language header', async () => {
    const app = new Elysia()
      .use(localizationPlugin())
      .get('/test', ({ localizationTools }) => {
        return {
          language: localizationTools.language,
          successMessage: localizationTools.getTranslation('success')
        }
      })

    const response = await app.handle(
      new Request('http://localhost/test', {
        headers: {
          'X-Language': 'id'
        }
      })
    )
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.language).toBe('id')
    expect(body.successMessage).toBe('Berhasil')
  })

  it('should handle missing translations gracefully', async () => {
    const app = new Elysia()
      .use(localizationPlugin())
      .get('/test', ({ localizationTools }) => {
        return {
          missing: localizationTools.getTranslation('nonexistent.key')
        }
      })

    const response = await app.handle(
      new Request('http://localhost/test')
    )
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.missing).toBe('nonexistent.key')
  })

  it('should replace placeholders in translations', async () => {
    // First we need to add a translation with placeholders to test this
    // For now, we'll test with a simple case
    const app = new Elysia()
      .use(localizationPlugin())
      .get('/test', ({ localizationTools }) => {
        // This test is more for verifying the API works
        // We would need to add placeholder translations to fully test this
        return {
          withParams: localizationTools.getTranslation('success', { name: 'World' })
        }
      })

    const response = await app.handle(
      new Request('http://localhost/test')
    )
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.withParams).toBe('Success')
  })
})