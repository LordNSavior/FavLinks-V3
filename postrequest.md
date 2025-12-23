# Post Requests

## User/Public Endpoints

### Register
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "secret123"}'
```

### Login (returns JWT token)
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "secret123"}'
```

### Get current user
```bash
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get all links for logged-in user
```bash
curl http://localhost:5000/links \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a link
```bash
curl -X POST http://localhost:5000/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Google", "url": "https://google.com", "isPublic": false}'
```

### Delete a link
```bash
curl -X DELETE http://localhost:5000/links/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get activities
```bash
curl http://localhost:5000/activities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get public/shared links (no auth needed)
```bash
curl http://localhost:5000/links/public
```

## Admin Endpoints

### List all users
```bash
curl http://localhost:5000/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update user admin status
```bash
curl -X PUT http://localhost:5000/admin/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAdmin": true}'
```

### Delete a user
```bash
curl -X DELETE http://localhost:5000/admin/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
