import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});


export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── Property Schemas ───────────────────────────────────────────────────────────

export const ListingPurposeSchema = z.enum(['SALE', 'RENT', 'LEASE', 'PG', 'COMMERCIAL_LEASE']);
export const CategoryTypeSchema = z.enum(['RESIDENTIAL', 'COMMERCIAL', 'LAND', 'SPECIAL']);
export const PropertyTypeEnumSchema = z.enum([
  'HOUSE', 'APARTMENT', 'VILLA', 'FARMHOUSE', 'ROOM', 'PG', 'HOSTEL', 'BUILDER_FLOOR', 'STUDIO',
  'SHOP', 'OFFICE', 'SHOWROOM', 'WAREHOUSE', 'GODOWN', 'COMMERCIAL_BUILDING', 'CO_WORKING', 'COMMERCIAL_SPACE', 'INDUSTRIAL_PROPERTY',
  'RESIDENTIAL_PLOT', 'COMMERCIAL_PLOT', 'AGRICULTURAL_LAND', 'FARM_LAND', 'INDUSTRIAL_LAND', 'LAND_PARCEL',
  'HALL', 'MARRIAGE_HALL', 'BANQUET_HALL', 'COMMUNITY_HALL', 'GUEST_HOUSE', 'HOTEL', 'SCHOOL', 'HOSPITAL', 'OTHER',
]);

export const ListingTypeSchema = z.enum(['SELL', 'RENT', 'LEASE']);
export const PriceTypeSchema = z.enum([
  'TOTAL_PRICE', 'RENT', 'LEASE_RENT', 'PG_RENT', 'COMMERCIAL_LEASE_RENT', 'PER_HOUR', 'PER_DAY', 'PER_EVENT', 'MONTHLY',
]);
export const BillingPeriodSchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'PER_EVENT', 'PER_DAY', 'PER_HOUR', 'LUMP_SUM']);

export const FurnishedStatusSchema = z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED']);
export const ConstructionStatusSchema = z.enum(['READY_TO_MOVE', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH']);
export const AreaUnitSchema = z.enum(['SQ_FT', 'SQ_MT', 'ACRE', 'BIGHA', 'BISWA', 'HECTARE', 'MARLA', 'KANAL', 'SQ_YARD']);
export const PropertyStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'SOLD',
  'RENTED',
  'LEASED',
  'EXPIRED',
  'ARCHIVED',
]);

export const PropertyLocationSchema = z.object({
  address: z.string().max(500).optional(),
  locality: z.string().max(200).optional(),
  city: z.string().min(2, 'City is required').max(100),
  district: z.string().max(100).optional(),
  state: z.string().min(2, 'State is required').max(100),
  country: z.string().min(2).max(100).default('India'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode').or(z.literal('')).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsLink: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
});

export const CreatePropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  listingPurpose: ListingPurposeSchema,
  categoryType: CategoryTypeSchema,
  propertyType: PropertyTypeEnumSchema,
  priceAmount: z.number().positive('Price amount must be a positive number'),
  priceType: PriceTypeSchema.default('TOTAL_PRICE'),
  billingPeriod: BillingPeriodSchema.optional(),
  isPriceNegotiable: z.boolean().optional(),
  pricePerSqFt: z.number().positive().optional(),
  location: PropertyLocationSchema,
  amenityIds: z.array(z.string()).optional(),
  customAmenities: z.array(z.string().max(50)).max(20).optional(),
  imageUrls: z.array(z.string()).optional(),
  imageStorageKeys: z.array(z.string().nullable()).optional(),
  videos: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),

  // Dynamic Extension Payloads
  residentialDetails: z.record(z.unknown()).optional(),
  commercialDetails: z.record(z.unknown()).optional(),
  landDetails: z.record(z.unknown()).optional(),
  pgDetails: z.record(z.unknown()).optional(),
  leaseDetails: z.record(z.unknown()).optional(),
  commercialLeaseDetails: z.record(z.unknown()).optional(),
  hallDetails: z.record(z.unknown()).optional(),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

export const PropertyFiltersSchema = z.object({
  keyword: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  listingPurpose: ListingPurposeSchema.optional(),
  categoryType: CategoryTypeSchema.optional(),
  propertyType: PropertyTypeEnumSchema.optional(),
  listingType: ListingTypeSchema.optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minArea: z.coerce.number().positive().optional(),
  maxArea: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  furnishedStatus: FurnishedStatusSchema.optional(),
  constructionStatus: ConstructionStatusSchema.optional(),
  amenityIds: z.array(z.string().uuid()).optional(),
  isPopular: z.coerce.boolean().optional(),
  status: PropertyStatusSchema.optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'popular'])
    .optional()
    .default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ─── Project Schemas ────────────────────────────────────────────────────────────

export const ProjectStatusSchema = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']);
export const PlotStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED']);
export const PlotFacingSchema = z.enum([
  'NORTH', 'SOUTH', 'EAST', 'WEST',
  'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST',
]);

export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  developer: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  country: z.string().min(2).max(100).default('India'),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  totalArea: z.number().positive().optional(),
  totalPlots: z.number().int().positive(),
  status: ProjectStatusSchema.default('UPCOMING'),
  amenityIds: z.array(z.string().uuid()).optional(),
});

export const CreatePlotSchema = z.object({
  plotNumber: z.string().min(1).max(50),
  area: z.number().positive(),
  areaUnit: AreaUnitSchema,
  price: z.number().positive(),
  facing: PlotFacingSchema.optional(),
  status: PlotStatusSchema.default('AVAILABLE'),
  coordinates: z
    .array(z.object({ lat: z.number(), lng: z.number() }))
    .optional(),
  polygonGeometry: z.any().optional(),
});

export const UpdatePlotStatusSchema = z.object({
  status: PlotStatusSchema,
});

// ─── Blog Schemas ───────────────────────────────────────────────────────────────

export const BlogStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const BlogLanguageSchema = z.enum(['en', 'hi', 'hinglish']);

export const BlogFaqItemSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(5, 'Question is too short').max(500),
  answer: z.string().min(5, 'Answer is too short').max(5000),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const BlogBaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300),
  slug: z.string()
    .min(3)
    .max(300)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
    .optional(),
  excerpt: z.string().max(500).optional(),

  // Rich text content (new) — one of these is required
  content: z.string().optional(),
  contentJson: z.record(z.unknown()).optional(),

  language: BlogLanguageSchema.default('en'),
  translationGroupId: z.string().uuid().optional().nullable().or(z.literal('')),

  categoryId: z.string().uuid().optional().nullable().or(z.literal('')),
  tagIds: z.array(z.string().uuid()).optional().default([]),

  // Featured Image
  featuredImageUrl: z.string().url().optional().or(z.literal('')),
  featuredImageAlt: z.string().max(200).optional(),
  featuredImageCaption: z.string().max(500).optional(),

  // Legacy SEO (kept for backward compat)
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),

  // New primary SEO fields
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  focusKeyword: z.string().max(100).optional(),
  secondaryKeywords: z.array(z.string().max(100)).max(10).optional().default([]),

  canonicalUrl: z.string().url().optional().or(z.literal('')),

  // Open Graph
  ogTitle: z.string().max(95).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal('')),
  ogImageAlt: z.string().max(200).optional(),

  // Twitter / X Card
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).default('summary_large_image'),
  twitterTitle: z.string().max(70).optional(),
  twitterDescription: z.string().max(200).optional(),
  twitterImageUrl: z.string().url().optional().or(z.literal('')),

  // Advanced SEO
  schemaType: z.string().max(100).optional().default('BlogPosting'),
  noIndex: z.boolean().optional().default(false),
  noFollow: z.boolean().optional().default(false),
  allowIndex: z.boolean().optional().default(true),
  allowFollow: z.boolean().optional().default(true),

  // Features
  generateToc: z.boolean().optional().default(false),
  status: BlogStatusSchema.default('DRAFT'),

  // FAQs
  faqs: z.array(BlogFaqItemSchema).optional().default([]),
});

// CreateBlogSchema adds the refine (either content or contentJson required)
export const CreateBlogSchema = BlogBaseSchema.refine(
  (data) => !!(data.content || data.contentJson),
  { message: 'Either content or contentJson must be provided', path: ['content'] }
);

// UpdateBlogSchema is built from the base (no refine — all fields are optional)
export const UpdateBlogSchema = BlogBaseSchema.partial();


export const CreateBlogCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
  description: z.string().max(1000).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const UpdateBlogCategorySchema = CreateBlogCategorySchema.partial();

export const CreateBlogTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
});

export const UpdateBlogTagSchema = CreateBlogTagSchema.partial();

export const BlogFaqReorderSchema = z.object({
  faqs: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int().min(0),
  })),
});

// ─── Message Schemas ────────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  messageType: z.enum(['TEXT', 'IMAGE']).default('TEXT'),
  replyToMessageId: z.string().uuid().optional(),
});

export const EditMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const AddReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

// ─── User Schemas ───────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number')
    .optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export const AdminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
});

// ─── Pagination ─────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const OffsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Notification Schemas ───────────────────────────────────────────────────────

export const UpdateNotificationPreferenceSchema = z.object({
  type: z.string().min(1),
  enabled: z.boolean(),
});

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
});

// ─── Group Schemas ──────────────────────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const AddGroupMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});

// ─── Admin Property Moderation ──────────────────────────────────────────────────

export const ModeratePropertySchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});

export const SetPopularPropertySchema = z.object({
  isPopular: z.boolean(),
  popularRank: z.number().int().min(1).max(9999).optional(),
});

// ─── Posters & Banners ────────────────────────────────────────────────────────

export const UpdatePosterSchema = z.object({
  title: z.string().max(150).nullable().optional(),
  redirectUrl: z.string().url().or(z.literal('')).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── Company Communication ───────────────────────────────────────────────────

export const UpdateCompanyCommunicationSchema = z.object({
  whatsappNumber: z.string().max(20).nullable().optional(),
  whatsappMessage: z.string().max(500).nullable().optional(),
  instagramUrl: z.string().max(500).nullable().optional(),
  twitterUrl: z.string().max(500).nullable().optional(),
  youtubeUrl: z.string().max(500).nullable().optional(),
  facebookUrl: z.string().max(500).nullable().optional(),
  linkedinUrl: z.string().max(500).nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  contactEmail: z.string().email().or(z.literal('')).nullable().optional(),
  officeAddress: z.string().max(500).nullable().optional(),
});

// ─── Type Exports ───────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
export type PropertyFiltersInput = z.infer<typeof PropertyFiltersSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreatePlotInput = z.infer<typeof CreatePlotSchema>;
export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
export type CreateBlogCategoryInput = z.infer<typeof CreateBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof UpdateBlogCategorySchema>;
export type CreateBlogTagInput = z.infer<typeof CreateBlogTagSchema>;
export type BlogFaqItem = z.infer<typeof BlogFaqItemSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;
export type UpdatePosterInputType = z.infer<typeof UpdatePosterSchema>;
export type UpdateCompanyCommunicationInputType = z.infer<typeof UpdateCompanyCommunicationSchema>;


