import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { localizationPlugin } from '../plugins/localization_plugin'
import { responsePlugin } from '../plugins/response_plugin'

describe('Localization with Response Plugin Integration', () => {
  it('should use localized messages in response tools', async () => {
    const app = new Elysia()
      .use(localizationPlugin())
      .use(responsePlugin())
      .get('/success', ({ responseTools }) => {
        return responseTools.generateResponse({ message: 'Hello' })
      })

    // Test with default language (English)
    const successResponse = await app.handle(
      new Request('http://localhost/success')
    )
    
    expect(successResponse.status).toBe(200)
    const successBody = await successResponse.json()
    expect(successBody.meta.message).toBe('Success')
  })

  it('should use localized messages based on X-Language header', async () => {
    const app = new Elysia()
      .use(localizationPlugin())
      .use(responsePlugin())
      .get('/success', ({ responseTools }) => {
        return responseTools.generateResponse({ message: 'Hello' })
      })

    // Test with Indonesian language
    const response = await app.handle(
      new Request('http://localhost/success', {
        headers: {
          'X-Language': 'id'
        }
      })
    )
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.message).toBe('Berhasil')
  })
})