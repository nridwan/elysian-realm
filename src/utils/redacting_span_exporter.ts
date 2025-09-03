import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult } from '@opentelemetry/core';

const redactedKeys = {
  request: ['password'],
  response: ['password'],
};

class RedactingSpanExporter implements SpanExporter {
  private exporter: SpanExporter;

  constructor(exporter: SpanExporter) {
    this.exporter = exporter;
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    const redactedSpans = spans.map((span) => this.redactSpan(span));
    this.exporter.export(redactedSpans, resultCallback);
  }

  shutdown(): Promise<void> {
    return this.exporter.shutdown();
  }

  private redactSpan(span: ReadableSpan): ReadableSpan {
    const { attributes } = span;

    this.redactAttribute(attributes, 'http.request.body', redactedKeys.request);
    this.redactAttribute(attributes, 'http.response.body', redactedKeys.response);

    // Handle nested 'attributes.custom' object if present
    if (attributes.custom && typeof attributes.custom === 'object') {
      const customAttributes = attributes.custom as Record<string, any>;
      this.redactAttribute(customAttributes, 'http.request.body', redactedKeys.request);
    }

    return span;
  }

  private redactAttribute(
    attributes: Record<string, any>,
    attributeKey: string,
    keysToRedact: string[]
  ): void {
    const attributeValue = attributes[attributeKey];

    if (attributeValue && typeof attributeValue === 'string') {
      try {
        const parsedValue = JSON.parse(attributeValue);

        keysToRedact.forEach((key) => {
          if (parsedValue[key]) {
            parsedValue[key] = '[REDACTED]';
          }
        });

        attributes[attributeKey] = JSON.stringify(parsedValue);
      } catch (error) {
        console.error(`Error parsing attribute '${attributeKey}':`, error);
      }
    }
  }
}

export { RedactingSpanExporter };