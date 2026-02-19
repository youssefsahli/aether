# API Documentation

## Overview

Brief description of the API.

## Base URL

```
https://api.example.com/v1
```

## Authentication

Include API key in headers:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### GET /resource

Retrieves a list of resources.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | number | No | Max items to return |
| offset | number | No | Pagination offset |

**Response:**
```json
{
  "data": [],
  "total": 0
}
```

### POST /resource

Creates a new resource.

**Body:**
```json
{
  "name": "string",
  "value": "string"
}
```

**Response:** `201 Created`

### PUT /resource/:id

Updates an existing resource.

### DELETE /resource/:id

Deletes a resource.

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |
