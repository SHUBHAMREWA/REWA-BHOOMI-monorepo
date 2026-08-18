# SCALABLE REAL ESTATE MARKETPLACE — MASTER SYSTEM SPECIFICATION

## 1. PROJECT OVERVIEW

Build a production-ready, scalable Real Estate Marketplace application.

The platform allows users to:

* Register/login
* Login with Google
* Reset forgotten passwords
* Browse properties
* Search and filter properties
* Create property listings
* Edit their listings
* Delete their listings
* Save/favorite properties
* Communicate with administrators through real-time chat
* Receive real-time notifications
* Eventually participate in audio/video calls with administrators
* Join administrator-created groups for future group communication

Administrators have additional capabilities:

* Manage users
* Manage all properties
* Create properties
* Edit/delete properties
* Promote properties as "Popular"
* Manage project properties
* Create project plot maps
* Manage plot availability/status
* Create project heat maps
* Manage blogs
* Manage conversations
* Communicate with users
* Initiate audio/video calls
* Create groups
* Manage group members
* Send notifications

The application must be:

* Scalable
* Secure
* SEO friendly
* PWA enabled
* Fast
* Mobile responsive
* Production ready
* Maintainable
* Modular
* Easy to extend in the future

Do NOT add unnecessary animations.

Performance and usability are more important than visual effects.

---

# 2. TECHNOLOGY STACK

## Frontend

Use:

* Next.js
* TypeScript
* Tailwind CSS
* Material UI
* React
* Next.js App Router

Use Server Components wherever appropriate.

Use Client Components only when client-side interaction/state is required.

Avoid unnecessary client-side JavaScript.

Use dynamic imports/code splitting where appropriate.

---

# 3. BACKEND

Use:

* Node.js
* TypeScript
* Express.js
* PostgreSQL

Build the backend as a modular REST API.

Architecture should allow future migration toward microservices without requiring a complete rewrite.

Recommended modules:

```text
Auth
Users
Properties
Property Categories
Favorites
Projects
Project Plots
Notifications
Chat
Groups
Calls
Blogs
Admin
Media
Search
Audit Logs
```

---

# 4. DATABASE

Use PostgreSQL as the primary database.

Use a proper relational schema.

Do NOT put everything inside one or two large tables.

Use normalized tables with appropriate foreign keys, indexes and constraints.

Potential database structure:

```text
users
roles
permissions
user_roles

properties
property_categories
property_images
property_amenities
property_amenity_mapping

favorites

projects
project_images
project_plots
project_plot_images
project_plot_status

blogs
blog_categories
blog_images

conversations
conversation_members
messages
message_attachments
message_reactions
message_replies

notifications
notification_preferences

groups
group_members
group_messages

calls
call_participants

media_assets

audit_logs
```

Use UUIDs for public entity IDs.

Do not expose sequential database IDs publicly.

---

# 5. USER AUTHENTICATION

Users must be able to:

### Registration

* Name
* Email
* Phone
* Password
* Confirm password

Validate all input.

Passwords must NEVER be stored as plain text.

Use strong password hashing such as Argon2 or bcrypt.

### Login

Support:

* Email + password
* Google OAuth

### Password Reset

Implement:

```text
Forgot Password
        ↓
Enter Email
        ↓
Generate secure reset token
        ↓
Send email
        ↓
Reset password
        ↓
Invalidate token
```

Reset tokens must:

* Be cryptographically secure
* Have expiration
* Be single-use
* Be invalidated after successful reset

---

# 6. AUTHORIZATION

Implement Role-Based Access Control.

Roles:

```text
USER
ADMIN
SUPER_ADMIN
```

Never trust the frontend for authorization.

Every protected backend endpoint must verify:

1. Authentication
2. User identity
3. Role/permission
4. Resource ownership where applicable

Example:

A user can edit:

```text
ONLY their own property
```

An ADMIN can:

```text
View all properties
Edit properties
Delete properties
Create properties
Manage users
Manage blogs
Manage projects
Manage chats
```

SUPER_ADMIN can additionally manage administrative privileges.

---

# 7. AUTHENTICATION TOKEN ARCHITECTURE

Use secure authentication.

Recommended:

```text
Short-lived Access Token
+
Long-lived Refresh Token
```

Prefer secure HttpOnly cookies for browser authentication where appropriate.

Refresh tokens must support:

* Rotation
* Expiration
* Revocation
* Device/session tracking

Never store sensitive authentication tokens in localStorage unless there is a strong architectural reason.

Implement logout from all devices.

---

# 8. PROPERTY SYSTEM

Users and administrators can create property listings.

Property listing types:

```text
SELL
RENT
LEASE
```

Property categories:

```text
PLOT
HOUSE
VILLA
LAND
APARTMENT
FLAT
COMMERCIAL
OFFICE
SHOP
WAREHOUSE
FARMHOUSE
OTHER
```

The system must be extensible so new categories can be added without changing application architecture.

---

# 9. PROPERTY DATA

A property can contain:

```text
Title
Slug
Description
Price
Property Type
Listing Type
Location
Address
City
State
Country
Pincode
Latitude
Longitude
Area
Area Unit
Bedrooms
Bathrooms
Parking
Furnished Status
Construction Status
Amenities
Images
Videos
Owner
Created At
Updated At
Published At
Status
```

Property status:

```text
DRAFT
PENDING_REVIEW
PUBLISHED
REJECTED
SOLD
RENTED
ARCHIVED
```

---

# 10. PROPERTY SLUG

Every public property must have an SEO-friendly slug.

Example:

```text
/ properties / luxury-villa-in-rewa-3bhk
```

Do not expose database IDs in SEO URLs.

Slugs must be unique.

If a property title changes, handle slug changes carefully and preserve redirects where appropriate.

---

# 11. PROPERTY OWNERSHIP

Every property must have:

```text
owner_id
```

Users can:

* Create their own property
* Edit their own property
* Delete their own property
* View their own listings

Users cannot modify another user's property.

Admins can manage all properties.

---

# 12. PROPERTY IMAGES

Use Cloudflare storage for images.

Recommended architecture:

```text
Frontend
   ↓
Compress Image
   ↓
Convert to WebP
   ↓
Upload
   ↓
Cloudflare
   ↓
Save Media Metadata in PostgreSQL
```

Do not store image binary data inside PostgreSQL.

Database should store metadata such as:

```text
id
property_id
storage_key
url
width
height
size
mime_type
sort_order
created_at
```

---

# 13. IMAGE OPTIMIZATION

Frontend should:

* Compress images
* Resize oversized images
* Convert supported images to WebP
* Validate file size
* Validate MIME type

Backend must also validate uploaded files.

Never trust frontend validation alone.

Use responsive image sizes.

Generate appropriate thumbnails.

Avoid loading full-resolution images when displaying thumbnails.

---

# 14. IMAGE DELETION

When a property is deleted:

```text
Delete property
      ↓
Find associated media
      ↓
Delete Cloudflare objects
      ↓
Delete media records
      ↓
Delete property
```

Do not leave orphaned files in Cloudflare.

Use background jobs where appropriate for large deletion operations.

Also implement a cleanup mechanism for orphaned media.

---

# 15. SEARCH

Property search must be fast.

Support:

```text
Keyword
City
Location
Property Type
Listing Type
Min Price
Max Price
Min Area
Max Area
Bedrooms
Bathrooms
Amenities
Furnished Status
Construction Status
```

Support sorting:

```text
Newest
Oldest
Price Low → High
Price High → Low
Area Low → High
Area High → Low
Popular
```

Use PostgreSQL indexes.

For location-heavy searching, consider PostgreSQL PostGIS.

Design the search layer so Elasticsearch/OpenSearch can be introduced later if search requirements become very large.

---

# 16. PROPERTY PAGINATION

Never return thousands of properties in one API response.

Use pagination.

Prefer cursor-based pagination for large datasets.

Example:

```text
GET /properties?cursor=abc&limit=20
```

For simple admin tables, offset pagination can also be used.

Always enforce maximum page size.

Example:

```text
limit <= 100
```

---

# 17. FAVORITE / SAVED PROPERTY

Users can save properties.

Frontend wording can be:

```text
Favorite
Saved Properties
```

Database:

```text
favorites
```

Relationship:

```text
user_id
property_id
created_at
```

Add a unique constraint:

```text
UNIQUE(user_id, property_id)
```

Users can:

* Add favorite
* Remove favorite
* View favorite properties

Do not implement favorites as a large JSON array inside the user table.

---

# 18. POPULAR PROPERTIES

Admins can mark properties as popular.

Example:

```text
is_popular
popular_rank
```

Popular properties should appear higher in appropriate listings.

Do NOT permanently manipulate the created_at date to move properties to the top.

Use explicit ranking logic.

Example:

```text
Popular
+
Admin Rank
+
Relevance
+
Created Date
```

---

# 19. ADMIN DASHBOARD

Create a separate admin dashboard.

Admin dashboard should contain:

```text
Dashboard
Users
Properties
Projects
Plots
Blogs
Chats
Groups
Calls
Notifications
Media
Reports
Audit Logs
Settings
```

Dashboard statistics:

```text
Total Users
Active Users
Total Properties
Published Properties
Pending Properties
Sold Properties
Rented Properties
Popular Properties
Total Projects
Total Blogs
Unread Chats
```

---

# 20. USER MANAGEMENT

Admin can:

* View users
* Search users
* Filter users
* View user profile
* View user's properties
* Edit allowed user information
* Suspend user
* Activate user
* Delete/deactivate user
* View account activity

Use soft delete/deactivation where appropriate.

Do not immediately hard-delete important records that are needed for audit/history.

---

# 21. PROJECT PROPERTY SYSTEM

Project Properties are different from normal properties.

A project can contain:

```text
Project Name
Slug
Description
Developer
Location
Address
City
State
Country
Latitude
Longitude
Images
Project Map
Total Area
Total Plots
Amenities
Status
```

Example:

```text
Green Valley Project
```

Inside the project:

```text
Plot 1
Plot 2
Plot 3
Plot 4
...
```

---

# 22. PROJECT PLOT SYSTEM

Each project plot should have:

```text
Plot Number
Plot Area
Area Unit
Price
Facing
Status
Coordinates
Polygon / Map Geometry
```

Plot status:

```text
AVAILABLE
RESERVED
SOLD
BLOCKED
```

Admin can update plot status.

Users can visually see the project layout.

---

# 23. PROJECT MAP

Create an interactive project map.

Possible implementation:

```text
Map
+
Project Boundary
+
Plot Polygons
+
Plot Numbers
+
Plot Status
```

The architecture should support interactive polygon areas.

For example:

```text
Green = Available
Yellow = Reserved
Red = Sold
Grey = Blocked
```

Do not hard-code these colors throughout the application.

Use a centralized configuration.

---

# 24. PROJECT HEAT MAP

Admin should be able to create a heat-map style visualization showing:

```text
Plot Size
Plot Price
Availability
Demand
Sales
```

The architecture must support future analytics.

Example:

```text
Small Plot
Medium Plot
Large Plot
Premium Plot
```

The heat map should be data-driven.

Do not create a fake static image.

---

# 25. ADMIN PROPERTY CREATION

Admin can create normal properties exactly like users.

However:

```text
created_by
owner_id
created_by_role
```

should be tracked.

This allows the system to know whether a property was created by:

```text
USER
ADMIN
```

---

# 26. BLOG SYSTEM

Admins can create SEO-friendly blogs.

Blog fields:

```text
Title
Slug
Excerpt
Content
Featured Image
Author
Category
Tags
Meta Title
Meta Description
Canonical URL
OG Title
OG Description
OG Image
Schema Data
Status
Published At
Created At
Updated At
```

Blog status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 27. BLOG SEO

Every blog should have:

```text
SEO Title
Meta Description
Canonical URL
Open Graph Title
Open Graph Description
Open Graph Image
Twitter Card
Structured Data
```

Generate:

```text
Article Schema
Breadcrumb Schema
Organization Schema
WebSite Schema
```

where appropriate.

---

# 28. REAL ESTATE SEO

SEO is a major requirement.

Every public property page must have:

```text
Unique URL
Unique slug
Title
Meta description
Canonical URL
Open Graph metadata
Twitter metadata
Property structured data
Breadcrumb structured data
```

Generate structured data using JSON-LD.

Potential schema types:

```text
RealEstateListing
Residence
Apartment
House
Product
Offer
BreadcrumbList
Organization
WebSite
```

Only use schema types where they are semantically valid.

Do not generate fake structured data.

---

# 29. SEO-FRIENDLY URL STRUCTURE

Recommended:

```text
/properties
/properties/for-sale
/properties/for-rent
/properties/plots
/properties/villas
/properties/rewa
/properties/rewa/for-sale
/property/luxury-villa-in-rewa
/projects
/projects/green-valley
/projects/green-valley/plots
/blog
/blog/how-to-buy-land-in-madhya-pradesh
```

Avoid:

```text
/property?id=123
```

for primary SEO pages.

---

# 30. NEXT.JS SEO

Use Next.js metadata APIs.

Implement:

```text
generateMetadata()
```

for dynamic property/blog/project pages.

Generate:

```text
sitemap.xml
robots.txt
```

Use dynamic sitemap generation for:

```text
Properties
Projects
Blogs
Important category pages
```

Implement canonical URLs.

Prevent indexing of:

```text
Admin pages
Login
Register
Private dashboards
Private chat
Internal APIs
```

---

# 31. PWA

The application must be a Progressive Web App.

Implement:

```text
manifest.json
Service Worker
Installable application
Offline fallback
App icons
Splash configuration
Caching strategy
```

Do not attempt to cache private user data insecurely.

Public property pages can use appropriate caching.

---

# 32. SERVICE WORKER

Use the service worker for:

```text
Static assets
Public assets
Offline fallback
Push notifications
Caching
```

Do not cache sensitive API responses blindly.

Use different strategies for:

```text
Static assets
Images
Public pages
Authenticated API requests
```

---

# 33. PUSH NOTIFICATIONS

Users should receive notifications when:

* A new property is published
* A relevant property becomes available
* Admin sends a message
* Someone responds in chat
* Property status changes
* Project plot becomes available
* Other important platform events occur

Use Web Push / appropriate push notification infrastructure.

Store push subscriptions securely.

Allow users to control notification preferences.

---

# 34. NOTIFICATION ARCHITECTURE

Create a notification system.

Database:

```text
notifications
```

Fields:

```text
id
user_id
type
title
message
data
read_at
created_at
```

Example notification:

```text
New Property Available
A new villa has been listed in Rewa.
```

Use real-time delivery where possible.

Persist notifications in the database so users can see notification history.

---

# 35. REAL-TIME CHAT

Users can chat ONLY with administrators.

User-to-user chat must NOT be allowed.

Admin can communicate with any user.

Architecture should be scalable.

Recommended:

```text
REST API
+
WebSocket
```

Use WebSocket for real-time events.

Possible technology:

```text
Socket.IO
```

or a native WebSocket architecture.

Keep the transport layer abstract so it can be replaced later.

---

# 36. CHAT DATA MODEL

Conversation:

```text
conversation
```

Members:

```text
conversation_members
```

Messages:

```text
messages
```

Attachments:

```text
message_attachments
```

Reactions:

```text
message_reactions
```

Replies:

```text
reply_to_message_id
```

Message fields:

```text
id
conversation_id
sender_id
message_type
content
reply_to_message_id
created_at
edited_at
deleted_at
```

---

# 37. CHAT FEATURES

Implement:

```text
Send message
Receive message
Typing indicator
Online/offline state
Read status
Delivered status
Message reactions
Reply to message
Edit message
Delete message
Image sharing
Image preview
Upload progress
Message timestamps
Unread count
Conversation list
Search messages
```

Deleted messages should use soft deletion where appropriate.

Example:

```text
deleted_at
```

rather than immediately removing the database record.

---

# 38. CHAT IMAGE UPLOAD

Do not send large images directly through WebSocket.

Use:

```text
Upload image
      ↓
Cloudflare storage
      ↓
Create attachment record
      ↓
Send attachment metadata through WebSocket
```

This keeps WebSocket traffic lightweight.

---

# 39. CHAT SCALABILITY

The chat system must be designed for horizontal scaling.

If multiple backend instances are running:

```text
Server A
Server B
Server C
```

messages/events must still reach the correct connected users.

Use a shared event/broker layer when required.

Recommended future architecture:

```text
Node.js servers
      ↓
Redis
      ↓
Pub/Sub
      ↓
WebSocket servers
```

Do not rely on in-memory state for critical cross-server communication.

---

# 40. WEBRTC CALLING

Implement WebRTC as a future-ready module.

Initial requirement:

```text
User ↔ Admin
Audio Call
Video Call
```

WebRTC should NOT be used as the signaling server.

Use:

```text
WebRTC
+
WebSocket signaling
+
STUN
+
TURN
```

Signaling handles:

```text
Offer
Answer
ICE candidates
Call accepted
Call rejected
Call ended
```

For production reliability, configure TURN infrastructure.

---

# 41. CALL DATABASE

Create:

```text
calls
call_participants
```

Track:

```text
caller
receiver
started_at
ended_at
duration
call_type
status
```

Call status:

```text
RINGING
ACCEPTED
REJECTED
MISSED
ENDED
FAILED
```

---

# 42. GROUP SYSTEM

Admins can create groups.

Example:

```text
Real Estate Investors
Green Valley Buyers
Project Customers
```

Admin can:

* Create group
* Edit group
* Delete group
* Add users
* Remove users
* View members
* Send group messages

Users can:

* Join allowed groups
* Leave groups
* View group
* Receive group notifications

---

# 43. FUTURE GROUP CALL

Design the group architecture so that group video/audio calling can be introduced later.

Do not build the current system in a way that prevents:

```text
1-to-1 call
```

from eventually becoming:

```text
Many-to-many call
```

For larger group calls, evaluate an SFU architecture rather than pure peer-to-peer WebRTC.

Potential future technologies:

```text
LiveKit
mediasoup
Janus
```

Do not implement these unless group calling is actually required.

---

# 44. SECURITY

Security is a first-class requirement.

Implement:

```text
Helmet
CORS
Rate limiting
Input validation
SQL injection protection
XSS protection
CSRF protection where applicable
Secure cookies
Password hashing
Token expiration
Refresh-token rotation
Authorization
File validation
MIME validation
Request size limits
Audit logging
```

Validate every request using a schema validation library.

Example:

```text
Zod
```

---

# 45. RATE LIMITING

Different endpoints should have different limits.

Example:

```text
Login
Password reset
OTP
Chat
Property creation
Search
```

should not all have the same rate limit.

Use Redis-backed rate limiting when multiple backend instances are deployed.

---

# 46. API DESIGN

Use RESTful API design.

Example:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/properties
GET    /api/v1/properties/:slug
POST   /api/v1/properties
PATCH  /api/v1/properties/:id
DELETE /api/v1/properties/:id

POST   /api/v1/properties/:id/favorite
DELETE /api/v1/properties/:id/favorite

GET    /api/v1/projects
GET    /api/v1/projects/:slug
POST   /api/v1/projects

GET    /api/v1/blogs
GET    /api/v1/blogs/:slug

GET    /api/v1/conversations
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages

GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
```

Use API versioning:

```text
/api/v1
```

---

# 47. RESPONSE FORMAT

Use a consistent API response structure.

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Property created successfully"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property not found"
  }
}
```

Never expose internal stack traces in production.

---

# 48. ERROR HANDLING

Create centralized error handling.

Use custom error classes.

Example:

```text
BadRequestError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
ValidationError
```

Log errors internally.

Return safe errors to users.

---

# 49. LOGGING

Implement structured logging.

Log:

```text
Request ID
User ID
Endpoint
HTTP method
Response status
Execution time
Error
IP where appropriate
```

Do not log:

```text
Passwords
Access tokens
Refresh tokens
Sensitive personal data
```

Use a production logging solution later.

---

# 50. AUDIT LOGS

Admin actions should be auditable.

Track:

```text
Who performed the action
What action was performed
Which resource was affected
When it happened
Before/after information where appropriate
```

Example:

```text
Admin changed property status:
PENDING → PUBLISHED
```

---

# 51. DATABASE INDEXING

Create indexes based on actual query patterns.

Important indexes may include:

```text
properties.slug
properties.owner_id
properties.status
properties.listing_type
properties.category_id
properties.city
properties.price
properties.created_at
properties.is_popular

favorites.user_id
favorites.property_id

messages.conversation_id
messages.created_at

notifications.user_id
notifications.read_at

projects.slug
project_plots.project_id
project_plots.status
```

Use composite indexes where query patterns justify them.

Do not blindly index every column.

---

# 52. DATABASE TRANSACTIONS

Use transactions when multiple related database operations must succeed together.

Example:

Property deletion:

```text
BEGIN
Delete property media records
Delete property
COMMIT
```

However, external Cloudflare deletion cannot be treated as a normal PostgreSQL transaction.

Therefore use a reliable cleanup/background-job strategy.

---

# 53. BACKGROUND JOBS

Introduce a background job architecture.

Potential jobs:

```text
Image deletion
Image processing
Notification delivery
Email delivery
Push notification
Search indexing
Sitemap generation
Orphaned media cleanup
Analytics processing
```

Use Redis + a queue system such as BullMQ if appropriate.

Do not execute expensive operations directly inside normal HTTP request handlers.

---

# 54. CACHING

Use caching where it provides measurable benefits.

Good candidates:

```text
Popular properties
Property categories
Project metadata
Public blog pages
Public configuration
```

Avoid caching highly dynamic/private data without proper invalidation.

Redis can be introduced for:

```text
Cache
Rate limiting
Pub/Sub
Queues
Sessions if needed
```

---

# 55. FRONTEND ARCHITECTURE

Use a modular frontend structure.

Example:

```text
src/
  app/
  components/
  features/
    auth/
    properties/
    projects/
    favorites/
    chat/
    notifications/
    blogs/
    admin/
  hooks/
  lib/
  services/
  types/
  utils/
```

Keep business logic out of UI components where possible.

---

# 56. FRONTEND STATE MANAGEMENT

Do not put everything into global state.

Use:

```text
Server state → React Query / TanStack Query
Local UI state → React state
Forms → React Hook Form
Validation → Zod
```

Use global state only where genuinely necessary.

---

# 57. UI/UX

Design should be:

```text
Clean
Fast
Professional
Mobile-first
Accessible
Responsive
```

Avoid:

```text
Heavy animations
Large unnecessary JavaScript bundles
Autoplay background videos
Unnecessary 3D
Excessive client components
```

Prioritize Core Web Vitals.

---

# 58. MATERIAL UI + TAILWIND

Use both carefully.

Define a clear responsibility:

```text
Tailwind → layout, spacing, responsive styling
Material UI → complex UI components
```

Avoid creating conflicting styling systems for the same component.

Create a centralized design system.

---

# 59. PROPERTY DETAIL PAGE

Property page should contain:

```text
Image Gallery
Title
Price
Location
Property Type
Listing Type
Area
Bedrooms
Bathrooms
Amenities
Description
Map
Seller/Owner information
Favorite button
Contact Admin
Share
Related Properties
```

For SEO, render important property information server-side.

---

# 60. PROPERTY LIST PAGE

Provide:

```text
Search
Filters
Sort
Pagination
Property cards
Map view
List view
Favorite
```

Property cards should load optimized thumbnails.

Use lazy loading.

---

# 61. MAP INTEGRATION

Design location functionality so the map provider can be replaced.

Potential technologies:

```text
Google Maps
Mapbox
OpenStreetMap
Leaflet
```

Do not tightly couple business logic to one provider.

---

# 62. ADMIN PROPERTY MODERATION

Recommended workflow:

```text
User creates property
        ↓
PENDING_REVIEW
        ↓
Admin reviews
        ↓
APPROVED → PUBLISHED
        ↓
or
REJECTED
```

This should be configurable.

Admin should be able to provide rejection reasons.

---

# 63. SOFT DELETE

Use soft delete for important entities where recovery/auditing matters.

Example:

```text
deleted_at
```

Do not automatically expose soft-deleted records in normal queries.

---

# 64. API SECURITY RULE

Never trust:

```text
role
userId
ownerId
price
property status
admin flags
```

sent from the frontend.

The backend must determine and validate these values.

---

# 65. FILE UPLOAD SECURITY

Validate:

```text
MIME type
File extension
File size
Image dimensions
```

Reject dangerous file types.

Generate storage keys rather than trusting filenames.

Never allow users to directly control arbitrary storage paths.

---

# 66. SEO + PERFORMANCE

Target:

```text
Fast initial page load
Good Core Web Vitals
Server-side rendering where useful
Static generation for blogs
Optimized property pages
Image optimization
Minimal JavaScript
Proper caching
```

Use:

```text
next/image
```

where compatible with the image architecture.

---

# 67. MOBILE/PWA UX

The application must work like a mobile application.

Provide:

```text
Bottom navigation where appropriate
Install prompt
Responsive dashboard
Touch-friendly buttons
Mobile filters
Mobile image gallery
Mobile chat UI
Push notifications
```

---

# 68. OBSERVABILITY

Production system should eventually include:

```text
Application logs
Error tracking
Performance monitoring
Database monitoring
API latency monitoring
WebSocket monitoring
Queue monitoring
```

Track:

```text
API response time
Error rate
Database query performance
WebSocket connection count
Notification delivery
Queue failures
```

---

# 69. TESTING

Implement:

### Unit tests

For:

```text
Business logic
Utilities
Validation
Permissions
```

### Integration tests

For:

```text
Authentication
Properties
Favorites
Admin operations
Chat
Notifications
```

### End-to-end tests

Important flows:

```text
Register
Login
Google Login
Create Property
Edit Property
Delete Property
Favorite Property
Admin Approval
Chat
Image Upload
Project Plot Selection
```

---

# 70. DEVELOPMENT ENVIRONMENTS

Support:

```text
Development
Staging
Production
```

Use environment variables.

Never commit secrets.

Example:

```text
DATABASE_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ACCESS_KEY
CLOUDFLARE_SECRET_KEY
CLOUDFLARE_BUCKET
REDIS_URL
TURN_SERVER_URL
TURN_USERNAME
TURN_PASSWORD
```

Create:

```text
.env.example
```

without real secrets.

---

# 71. MONOREPO

Use a monorepo because the application contains frontend, backend and shared types.

Recommended:

```text
apps/
  web/
  api/

packages/
  types/
  validation/
  config/
  ui/
  eslint-config/
  tsconfig/
```

Use:

```text
pnpm
```

and a workspace structure.

Keep shared API types and validation schemas reusable where appropriate.

---

# 72. PROJECT STRUCTURE

Recommended:

```text
real-estate-platform/

├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── services/
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── properties/
│       │   │   ├── projects/
│       │   │   ├── blogs/
│       │   │   ├── chat/
│       │   │   ├── notifications/
│       │   │   ├── calls/
│       │   │   └── admin/
│       │   ├── middleware/
│       │   ├── config/
│       │   ├── database/
│       │   └── server.ts
│
├── packages/
│   ├── types/
│   ├── validation/
│   ├── ui/
│   ├── config/
│   └── eslint-config/
│
├── docker/
├── docs/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 73. IMPLEMENTATION PHASES

Do NOT try to implement the entire system at once.

Build incrementally.

## PHASE 1 — Foundation

Implement:

```text
Monorepo
Next.js
Express
TypeScript
PostgreSQL
Environment configuration
Database connection
Logging
Error handling
Validation
API versioning
```

---

## PHASE 2 — Authentication

Implement:

```text
Registration
Login
Logout
Google OAuth
Refresh token
Forgot password
Reset password
RBAC
```

---

## PHASE 3 — Property Marketplace

Implement:

```text
Property categories
Create property
Edit property
Delete property
Property listing
Property details
Search
Filters
Pagination
Favorites
```

---

## PHASE 4 — Media

Implement:

```text
Cloudflare storage
Image compression
WebP conversion
Upload
Delete
Thumbnail
Media cleanup
```

---

## PHASE 5 — Admin

Implement:

```text
Admin dashboard
User management
Property management
Property moderation
Popular properties
Admin-created properties
```

---

## PHASE 6 — Projects

Implement:

```text
Projects
Project plots
Plot status
Interactive project map
Plot details
Heat map
```

---

## PHASE 7 — Blogs + SEO

Implement:

```text
Blog CMS
Slug
Metadata
Canonical
OG tags
JSON-LD
Sitemap
Robots
Breadcrumbs
Property SEO
Project SEO
```

---

## PHASE 8 — Notifications

Implement:

```text
Notification database
Real-time notification
Push notifications
Service worker
PWA
Notification preferences
```

---

## PHASE 9 — Chat

Implement:

```text
Conversation
Messages
WebSocket
Unread count
Typing
Read receipts
Images
Reactions
Replies
Delete
Edit
```

---

## PHASE 10 — WebRTC

Implement:

```text
Call signaling
1-to-1 audio
1-to-1 video
Call states
STUN
TURN
Call history
```

---

## PHASE 11 — Groups

Implement:

```text
Groups
Members
Join
Leave
Admin controls
Group messaging
Group notifications
```

Keep architecture ready for future group calling.

---

# 74. SCALABILITY ARCHITECTURE

The application should eventually support:

```text
                 ┌───────────────┐
                 │     CDN       │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │    Next.js    │
                 │   Frontend    │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │ Load Balancer │
                 └───────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      ┌───▼───┐      ┌───▼───┐      ┌───▼───┐
      │ API 1 │      │ API 2 │      │ API 3 │
      └───┬───┘      └───┬───┘      └───┬───┘
          │              │              │
          └──────────────┼──────────────┘
                         │
              ┌──────────▼──────────┐
              │       Redis         │
              │ Cache / PubSub/Queue│
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │     PostgreSQL      │
              └─────────────────────┘

                         +
                         
                 ┌───────────────┐
                 │   Cloudflare  │
                 │    Storage    │
                 └───────────────┘
```

Design the application so that API instances are stateless.

Do not depend on local server memory for critical state.

---

# 75. FUTURE SCALABILITY

The architecture should allow future services such as:

```text
Search Service
Notification Service
Chat Service
Media Service
Analytics Service
Recommendation Service
Payment Service
```

However, DO NOT prematurely split everything into microservices.

Start with a well-modularized monolithic backend.

Extract services only when there is a real scalability or ownership reason.

---

# 76. SEARCH ENGINE FUTURE

Initially use PostgreSQL search.

When property volume becomes very large, architecture should allow:

```text
PostgreSQL
      ↓
Event
      ↓
Search Index
      ↓
OpenSearch / Elasticsearch
```

Search indexing should be asynchronous.

---

# 77. PROPERTY RECOMMENDATION FUTURE

Design property data so future recommendation systems can use:

```text
User searches
Favorite properties
Viewed properties
Location
Price range
Property type
Listing type
```

Do not implement an AI recommendation system initially.

Prepare the data architecture for it.

---

# 78. ANALYTICS

Track important business events.

Examples:

```text
PROPERTY_VIEWED
PROPERTY_FAVORITED
PROPERTY_SHARED
PROPERTY_CONTACTED
PROPERTY_CREATED
PROPERTY_PUBLISHED
PROPERTY_SOLD
PROPERTY_RENTED
PROJECT_VIEWED
PLOT_VIEWED
BLOG_VIEWED
```

Do not overload PostgreSQL with huge raw analytics data forever.

Keep an architecture that allows a dedicated analytics system later.

---

# 79. SEO CONTENT STRATEGY

Blogs should target real estate search queries.

Property pages should contain meaningful unique content.

Avoid generating thousands of thin SEO pages with almost identical content.

Use canonical tags correctly.

Do not index:

```text
Every filter combination
Every sort combination
Private dashboard pages
Duplicate URLs
```

---

# 80. PERFORMANCE RULES

The application should follow these rules:

```text
No unnecessary animation
No unnecessary client components
No unnecessary API calls
No huge images
No huge JavaScript bundles
No N+1 database queries
No unbounded API responses
No unnecessary polling
No in-memory state for distributed features
```

Use:

```text
Caching
Pagination
Lazy loading
Code splitting
Image optimization
Database indexes
Connection pooling
Background jobs
CDN
```

---

# 81. IMPORTANT BACKEND RULE

Never perform this:

```text
GET all users
GET all properties
GET all messages
```

without pagination.

Every potentially large collection must have:

```text
pagination
filtering
sorting
```

---

# 82. DATABASE CONNECTION POOL

PostgreSQL connections must use a connection pool.

Do not create a new database connection for every request.

Configure pool size according to deployment environment.

Monitor connection exhaustion.

---

# 83. API DOCUMENTATION

Generate API documentation using OpenAPI/Swagger.

Document:

```text
Authentication
Properties
Projects
Blogs
Favorites
Notifications
Chat
Admin
Calls
```

Include:

```text
Request schema
Response schema
Authentication requirement
Error responses
```

---

# 84. GIT WORKFLOW

Use:

```text
main
develop
feature/*
bugfix/*
hotfix/*
```

Use pull requests.

Require:

```text
Lint
Type check
Tests
Build
```

before merging.

---

# 85. CI/CD

Create CI pipeline for:

```text
Install
Lint
TypeScript check
Unit tests
Integration tests
Build
```

Deployment should support:

```text
Staging
Production
```

Never deploy directly without build/test validation.

---

# 86. FINAL DEVELOPMENT PRINCIPLE

Build this as a production system, not as a demo project.

Priorities:

1. Security
2. Correctness
3. Performance
4. Scalability
5. Maintainability
6. SEO
7. UX
8. Visual polish

Do not over-engineer the first version.

Use modular architecture so future functionality can be added without rewriting existing modules.

---

# 87. ANTIGRAVITY IMPLEMENTATION INSTRUCTION

Before writing large amounts of code:

1. Analyze this complete specification.
2. Create the architecture.
3. Create the database ERD.
4. Create the folder structure.
5. Create API contracts.
6. Create authentication/authorization strategy.
7. Create frontend architecture.
8. Create the implementation roadmap.
9. Identify dependencies between modules.
10. Identify security risks.
11. Identify scalability risks.
12. Identify missing requirements.

Then implement the system phase by phase.

After each phase:

```text
Run type checking
Run lint
Run tests
Run build
Verify database migrations
Verify API contracts
Verify frontend functionality
```

Do not move to the next major phase if the previous phase is broken.

---

# 88. IMPORTANT — DO NOT MAKE ASSUMPTIONS

If a requirement is technically ambiguous, identify it clearly before implementing it.

Do not silently invent:

```text
Business rules
Payment rules
Property verification rules
Commission rules
User permissions
Legal requirements
Location rules
Notification rules
```

Create a `docs/ASSUMPTIONS.md` file containing assumptions that are necessary for implementation.

---

# 89. REQUIRED DOCUMENTATION

Create:

```text
README.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/API.md
docs/AUTHENTICATION.md
docs/SECURITY.md
docs/CHAT.md
docs/WEBRTC.md
docs/SEO.md
docs/PWA.md
docs/DEPLOYMENT.md
docs/ASSUMPTIONS.md
```

Documentation must be updated as the project evolves.

---

# 90. DEFINITION OF DONE

A feature is considered complete only when:

```text
Frontend implemented
Backend implemented
Database migration implemented
Validation implemented
Authorization implemented
Error handling implemented
Loading state implemented
Empty state implemented
Mobile responsive
Tests added
TypeScript passes
Lint passes
Build passes
Documentation updated
```

Do not mark a feature complete simply because the UI exists.

---

# FINAL GOAL

Build a fast, scalable and production-ready Real Estate Marketplace that supports:

```text
Users
Authentication
Google Login
Properties
Selling
Renting
Favorites
Search
Filtering
Admin
Property Moderation
Popular Properties
Projects
Project Plot Maps
Plot Availability
Heat Maps
Blogs
SEO
PWA
Push Notifications
Real-time Chat
Image Sharing
Reactions
Replies
WebRTC Calls
Groups
Future Group Calls
Cloudflare Media Storage
PostgreSQL
Redis
Background Jobs
Audit Logs
Analytics
```

The system must be designed for future growth without unnecessary microservice complexity.

Start with a modular monolith + monorepo architecture and evolve individual modules into independent services only when scale requires it.
