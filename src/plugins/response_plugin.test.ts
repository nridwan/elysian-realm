import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { responsePlugin } from './response_plugin'

describe('ResponsePlugin', () => {
  it('should add responseTools to the context', async () => {
    const app = new Elysia()
      .use(responsePlugin())
      .get('/test', ({ responseTools }) => {
        responseTools.setServiceName('TEST')
        return responseTools.generateResponse({ message: 'Hello World' })
      })

    const response = await app.handle(
      new Request('http://localhost/test')
    )
    
    expect(response.status).toBe(200)
    const text = await response.text()
    console.log('Response text:', text)
    
    // Try to parse as JSON
    let body
    try {
      body = JSON.parse(text)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      console.error('Response text:', text)
      throw e
    }
    
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('data')
    expect(body.meta.code).toBe('TEST-200')
    expect(body.meta.message).toBe('Success')
    expect(body.data).toEqual({ message: 'Hello World' })
  })
})