import Elysia from 'elysia'
import { opentelemetry } from '@elysiajs/opentelemetry'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'            
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

// OTel plugin options
export interface OtelOptions {
  /**
   * Enable or disable OpenTelemetry tracing
   * @default true
   */
  enabled?: boolean

  /**
   * Exporter type: 'console' or 'otlp'
   * @default 'console'
   */
  exporterType?: 'console' | 'otlp'

  /**
   * OTLP endpoint URL (required when exporterType is 'otlp')
   * @default undefined
   */
  otlpEndpoint?: string

  /**
   * Service name for traces
   * @default 'elysian-realm'
   */
  serviceName?: string
}
// Default options
const defaultOptions: OtelOptions = {
  enabled: true,
  exporterType: 'console',
  serviceName: 'elysian-realm',
}
// Create OTel Elysia plugin
export const otel = (options: OtelOptions = {}) => {
  const opts = { ...defaultOptions, ...options }

  if (!opts.enabled) {
    return (app: Elysia) => app
  }

  // Configure span processors based on exporter type
  let spanProcessors: any[] = []

  switch (opts.exporterType) {
    case 'console':
      spanProcessors = [new SimpleSpanProcessor(new ConsoleSpanExporter())]
      break

  
    case 'otlp':
      if (!opts.otlpEndpoint) {
        throw new Error('OTLP endpoint is required when exporterType is "otlp"')
      }
      spanProcessors = [new BatchSpanProcessor(new OTLPTraceExporter({ url: opts.otlpEndpoint }))]
      break

  
    default:
      throw new Error(`Unsupported exporter type: ${opts.exporterType}`)
  }

  // Return the official Elysia OTel plugin with our configuration
  return opentelemetry({
    spanProcessors,
    serviceName: opts.serviceName,
  })
}
export default otel