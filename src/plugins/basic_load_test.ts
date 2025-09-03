// Simple test to verify error handler plugin loads
console.log('Loading error handler plugin...')

import { errorHandlerPlugin } from './error_handler_plugin'

console.log('Applying error handler plugin...')
errorHandlerPlugin()

console.log('✅ Error handler plugin applied successfully!')