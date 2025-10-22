# Enhanced Audit System

## Overview

The enhanced audit system implements a step-by-step auditing process with transaction-like behavior:

1. Record the action name at the start of the target controller (if intended to audit)
2. Track table name and data changes (old value, new value) for each data update/delete/create
3. Support rollback functionality to mark audit records for deletion if needed
4. Log a single audit row when data changes exist

## Usage Patterns

### 1. Recording Action at Controller Start

```typescript
import { auditMiddleware } from './middleware/audit_middleware'

const app = new Elysia()
  .use(auditMiddleware())
  .post('/api/users', async ({ auditTools }) => {
    // Record the action at the start of the controller
    auditTools?.recordStartAction('user.create')
    
    // Continue with business logic...
    const user = await userService.create(userData)
    
    // Record changes made during the operation
    auditTools?.recordChange('users', null, user)
    
    return user
  })
```

### 2. Tracking Multiple Data Changes

```typescript
.put('/api/users/:id', async ({ params, auditTools }) => {
  // Record the initial action
  auditTools?.recordStartAction('user.update')
  
  // Get existing user data
  const existingUser = await userService.getById(params.id)
  
  // Perform updates
  const updatedUser = await userService.update(params.id, updateData)
  
  // Record changes to user table
  auditTools?.recordChange('users', existingUser, updatedUser)
  
  // If updating roles as well
  if (roleUpdate) {
    const existingRoles = await roleService.getByUserId(params.id)
    const updatedRoles = await roleService.updateUserRoles(params.id, roleUpdate)
    
    // Record multiple changes - will be grouped in single audit row
    auditTools?.recordChange('roles', existingRoles, updatedRoles)
  }
})
```

### 3. Rollback Functionality

```typescript
.post('/api/complex-operation', async ({ auditTools }) => {
  // Record the start action
  auditTools?.recordStartAction('complex.operation')
  
  try {
    // Perform multiple operations
    await operation1()
    auditTools?.recordChange('table1', oldValue1, newValue1)
    
    await operation2()
    auditTools?.recordChange('table2', oldValue2, newValue2)
    
    // More operations...
    
    return { success: true }
  } catch (error) {
    // Mark audit for rollback if operations fail
    auditTools?.markForRollback()
    
    // Handle error appropriately
    throw error
  }
})
```

### 4. Manual Flush (Direct Audit Logging)

```typescript
.get('/api/users/:id', async ({ params, auditTools }) => {
  // For read operations that still need audit logging
  auditTools?.recordStartAction('user.read')
  auditTools?.recordChange('users', null, { id: params.id })
  
  // Directly log the audit immediately (instead of waiting for onAfterHandle)
  await auditTools?.flushAudit()
  
  const user = await userService.getById(params.id)
  return user
})
```

### 5. Checking Current Audit Changes

```typescript
.get('/api/users/:id', async ({ params, auditTools }) => {
  // Record action and changes
  auditTools?.recordStartAction('user.access')
  auditTools?.recordChange('users', null, { id: params.id })
  
  // Check what changes are currently queued
  const currentChanges = auditTools?.getAuditChanges()
  console.log('Current audit changes:', currentChanges)
  
  const user = await userService.getById(params.id)
  return user
})
```

## Schema Changes

### AuditTrail Model
- Removed: `entity_type`, `entity_id`, `old_data`, `new_data`
- Added: `changes` (JSON array containing multiple table changes)
- Added: `is_rolled_back` (boolean flag to mark audits for rollback)

### Changes Array Structure
```typescript
{
  table_name: string,      // Name of the table that was changed
  old_value?: any,        // Previous state of the record (can be null)
  new_value?: any         // New state of the record (can be null)
}
```

## Backward Compatibility

The changes maintain the same middleware interface but with enhanced functionality. The old API methods have been replaced with the new enhanced API:

**Old (no longer available):**
- `addAction(data)`
- `logAction(data)`
- `getAuditTrail()`

**New:**
- `recordStartAction(action: string)` - Record action at controller start
- `recordChange(table_name: string, old_value?: any, new_value?: any)` - Record individual changes
- `markForRollback()` - Mark audit for rollback
- `flushAudit()` - Manually flush audit to database
- `getAuditChanges()` - Get current audit changes

## Audit Service Methods

The audit service has been updated to work with the new schema:

- `createAuditTrail(data)` - Creates an audit with the new changes array structure
- `getAuditTrails()` - Fetches paginated audit trails
- `getAuditTrailById()` - Fetches a specific audit trail
- `getAuditTrailsByEntityType()` - Searches within changes array for table names
- `getAuditTrailsByUserId()` - Fetches audits for a specific user
- `markAuditAsRolledBack(id)` - Marks an audit as rolled back