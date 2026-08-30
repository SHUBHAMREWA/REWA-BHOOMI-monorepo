// ─── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

// ─── Property ──────────────────────────────────────────────────────────────────

export type ListingPurpose = 'SALE' | 'RENT' | 'LEASE' | 'PG' | 'COMMERCIAL_LEASE';

export type PropertyCategoryType = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'SPECIAL';

export type PropertyTypeEnum =
  // Residential
  | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'FARMHOUSE' | 'ROOM' | 'PG' | 'HOSTEL' | 'BUILDER_FLOOR' | 'STUDIO'
  // Commercial
  | 'SHOP' | 'OFFICE' | 'SHOWROOM' | 'WAREHOUSE' | 'GODOWN' | 'COMMERCIAL_BUILDING' | 'CO_WORKING' | 'COMMERCIAL_SPACE' | 'INDUSTRIAL_PROPERTY'
  // Land
  | 'RESIDENTIAL_PLOT' | 'COMMERCIAL_PLOT' | 'AGRICULTURAL_LAND' | 'FARM_LAND' | 'INDUSTRIAL_LAND' | 'LAND_PARCEL'
  // Special
  | 'HALL' | 'MARRIAGE_HALL' | 'BANQUET_HALL' | 'COMMUNITY_HALL' | 'GUEST_HOUSE' | 'HOTEL' | 'SCHOOL' | 'HOSPITAL' | 'OTHER';

export type ListingType = 'SELL' | 'RENT' | 'LEASE'; // Backward compatibility

export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'SOLD'
  | 'RENTED'
  | 'LEASED'
  | 'EXPIRED'
  | 'ARCHIVED';

export type PriceType =
  | 'TOTAL_PRICE'
  | 'RENT'
  | 'LEASE_RENT'
  | 'PG_RENT'
  | 'COMMERCIAL_LEASE_RENT'
  | 'PER_HOUR'
  | 'PER_DAY'
  | 'PER_EVENT'
  | 'MONTHLY';

export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'PER_EVENT' | 'PER_DAY' | 'PER_HOUR' | 'LUMP_SUM';

export type FurnishedStatus = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
export type ConstructionStatus = 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | 'NEW_LAUNCH';
export type AreaUnit = 'SQ_FT' | 'SQ_MT' | 'ACRE' | 'BIGHA' | 'BISWA' | 'HECTARE' | 'MARLA' | 'KANAL' | 'SQ_YARD';

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  storageKey?: string;
  width?: number;
  height?: number;
  sortOrder: number;
}

export interface PropertyLocation {
  address?: string;
  locality?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ResidentialDetails {
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  builtUpArea?: number;
  carpetArea?: number;
  plotArea?: number;
  propertyAge?: number;
  floor?: number;
  totalFloors?: number;
  furnishedStatus?: FurnishedStatus;
  parking?: number;
  facing?: string;
  waterSupply?: string;
  possessionStatus?: string;
  roadWidth?: number;
}

export interface CommercialDetails {
  carpetArea?: number;
  builtUpArea?: number;
  frontage?: number;
  depth?: number;
  floor?: number;
  totalFloors?: number;
  washrooms?: number;
  parking?: number;
  lift?: boolean;
  powerBackup?: boolean;
  airConditioning?: boolean;
  mainRoadFacing?: boolean;
  cornerProperty?: boolean;
  roadWidth?: number;
}

export interface LandDetails {
  totalLandArea: number;
  areaUnit: AreaUnit;
  landType?: string;
  irrigationAvailable?: boolean;
  waterSource?: string;
  borewell?: boolean;
  tubeWell?: boolean;
  canal?: boolean;
  riverAccess?: boolean;
  electricityConnection?: boolean;
  roadAccess?: boolean;
  soilType?: string;
  currentCrop?: string;
  fencing?: boolean;
  farmHouse?: boolean;
  nearestRoadDistance?: string;
  nearestVillage?: string;
  nearestCity?: string;
}

export interface PGDetails {
  pgName?: string;
  roomType: 'SINGLE' | 'DOUBLE_SHARING' | 'TRIPLE_SHARING' | 'FOUR_SHARING' | 'DORMITORY' | 'CUSTOM';
  occupancy?: string;
  genderPreference: 'MALE' | 'FEMALE' | 'ANY';
  availableFrom?: string;
  monthlyRent: number;
  securityDeposit?: number;
  foodCharges?: number;
  electricityCharges?: number;
  maintenanceCharges?: number;
  foodAvailable?: boolean;
  mealPlan?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'ALL_MEALS' | 'NO_FOOD';
  smokingAllowed?: boolean;
  alcoholAllowed?: boolean;
  visitorsAllowed?: boolean;
  petsAllowed?: boolean;
  curfewTime?: string;
  minimumStayMonths?: number;
  noticePeriodDays?: number;
}

export interface LeaseDetails {
  leaseAmount: number;
  leasePaymentType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LUMP_SUM' | 'NEGOTIABLE';
  securityDeposit?: number;
  leaseDurationYears?: number;
  lockInPeriodMonths?: number;
  noticePeriodDays?: number;
  availableFrom?: string;
  maintenanceResponsibility?: string;
  electricityResponsibility?: string;
  waterResponsibility?: string;
  renewalOption?: boolean;
  termsConditions?: string;
}

export interface CommercialLeaseDetails {
  monthlyLeaseRent: number;
  securityDeposit?: number;
  leaseDurationYears?: number;
  lockInPeriodMonths?: number;
  noticePeriodDays?: number;
  maintenanceCost?: number;
  camCost?: number;
  electricityCost?: number;
  waterCost?: number;
  parkingSpaces?: number;
  availableFrom?: string;
  renewalTerms?: string;
  rentEscalationPercentage?: number;
  escalationPeriodMonths?: number;
  allowedBusinessTypes?: string[];
  fireSafetyCertified?: boolean;
  powerLoadKw?: number;
  loadingUnloadingFacility?: boolean;
}

export interface HallDetails {
  hallType?: string;
  capacityPeople?: number;
  seatingCapacity?: number;
  hallAreaSqFt?: number;
  parkingCapacityVehicles?: number;
  acAvailable?: boolean;
  kitchenAvailable?: boolean;
  stageAvailable?: boolean;
  diningAreaAvailable?: boolean;
  washroomsCount?: number;
  soundSystemAvailable?: boolean;
  generatorBackupAvailable?: boolean;
  cateringAvailable?: boolean;
  pricingType: 'PER_HOUR' | 'PER_DAY' | 'PER_EVENT' | 'MONTHLY';
  priceRate: number;
  securityDeposit?: number;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  listingPurpose: ListingPurpose;
  categoryType: PropertyCategoryType;
  propertyType: PropertyTypeEnum;
  priceAmount: number;
  priceType: PriceType;
  billingPeriod?: BillingPeriod;
  isPriceNegotiable?: boolean;
  pricePerSqFt?: number;
  
  location: PropertyLocation;
  status: PropertyStatus;
  
  residentialDetails?: ResidentialDetails;
  commercialDetails?: CommercialDetails;
  landDetails?: LandDetails;
  pgDetails?: PGDetails;
  leaseDetails?: LeaseDetails;
  commercialLeaseDetails?: CommercialLeaseDetails;
  hallDetails?: HallDetails;

  amenities: PropertyAmenity[];
  images: PropertyImage[];
  videos?: string[];

  owner?: Pick<User, 'id' | 'name' | 'avatar_url'>;
  isPopular: boolean;
  popularRank?: number;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total?: number;
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

// ─── Project ───────────────────────────────────────────────────────────────────

export type ProjectStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';
export type PlotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'BLOCKED';
export type PlotFacing = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTH_EAST' | 'NORTH_WEST' | 'SOUTH_EAST' | 'SOUTH_WEST';

export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string;
  developer?: string;
  city: string;
  state: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  totalArea?: number;
  totalPlots: number;
  status: ProjectStatus;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPlot {
  id: string;
  projectId: string;
  plotNumber: string;
  area: number;
  areaUnit: AreaUnit;
  price: number;
  facing?: PlotFacing;
  status: PlotStatus;
  coordinates?: GeoCoordinate[];
  polygonGeometry?: GeoPolygon;
  createdAt: string;
  updatedAt: string;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// ─── Blog ──────────────────────────────────────────────────────────────────────

export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BlogLanguage = 'en' | 'hi' | 'hinglish';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface BlogFaq {
  id: string;
  blogId: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  /** Legacy plain-text/HTML content field — kept for backward compat */
  content: string;
  /** Tiptap JSON content (source of truth for rich text) */
  contentJson?: Record<string, unknown> | null;
  /** Server-rendered sanitized HTML from contentJson */
  contentHtml?: string | null;
  language: BlogLanguage;
  translationGroupId?: string | null;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  author: Pick<User, 'id' | 'name' | 'avatar_url'>;
  category?: BlogCategory;
  /** Legacy text array tags — kept for backward compat */
  tags: string[];
  /** New relational tags */
  blogTags?: BlogTag[];
  faqs?: BlogFaq[];
  // Legacy SEO fields (kept for backward compat)
  metaTitle?: string;
  metaDescription?: string;
  // New primary SEO fields
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageAlt?: string;
  // Twitter / X Card
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  // Advanced SEO
  schemaType?: string;
  /** Legacy fields — kept for backward compat */
  noIndex?: boolean;
  noFollow?: boolean;
  /** New fields — replaces noIndex/noFollow with correct semantics */
  allowIndex?: boolean;
  allowFollow?: boolean;
  // Content Features
  generateToc?: boolean;
  readingTime?: number | null;
  status: BlogStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  contentJson?: Record<string, unknown>;
  language?: BlogLanguage;
  translationGroupId?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  categoryId?: string;
  tagIds?: string[];
  tags?: string[];
  // Legacy SEO
  metaTitle?: string;
  metaDescription?: string;
  // New SEO
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageAlt?: string;
  // Twitter
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  // Advanced
  schemaType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  allowIndex?: boolean;
  allowFollow?: boolean;
  generateToc?: boolean;
  status?: BlogStatus;
  faqs?: Omit<BlogFaq, 'id' | 'blogId' | 'createdAt' | 'updatedAt'>[];
}

export type UpdateBlogInput = Partial<CreateBlogInput>;



// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'PROPERTY_PUBLISHED'
  | 'PROPERTY_STATUS_CHANGED'
  | 'PROPERTY_FAVORITED'
  | 'NEW_MESSAGE'
  | 'PLOT_AVAILABLE'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface Conversation {
  id: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface ConversationMember {
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  lastReadAt?: string;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: Pick<User, 'id' | 'name' | 'avatar_url'>;
  messageType: MessageType;
  content?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyToMessageId?: string;
  replyTo?: Pick<Message, 'id' | 'content' | 'sender'>;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  storageKey: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

// ─── Groups ────────────────────────────────────────────────────────────────────

export type GroupMemberRole = 'MEMBER' | 'ADMIN';

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  createdBy: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  role: GroupMemberRole;
  joinedAt: string;
}

// ─── Calls ─────────────────────────────────────────────────────────────────────

export type CallType = 'AUDIO' | 'VIDEO';
export type CallStatus =
  | 'RINGING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MISSED'
  | 'ENDED'
  | 'FAILED';

export interface Call {
  id: string;
  callerId: string;
  caller: Pick<User, 'id' | 'name' | 'avatar_url'>;
  receiverId: string;
  receiver: Pick<User, 'id' | 'name' | 'avatar_url'>;
  callType: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
}

// ─── API Response ──────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Favorites ─────────────────────────────────────────────────────────────────

export interface Favorite {
  userId: string;
  propertyId: string;
  property?: Property;
  createdAt: string;
}

// ─── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorId: string;
  actor?: Pick<User, 'id' | 'name'>;
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

// ─── Posters & Banners ────────────────────────────────────────────────────────

export interface Poster {
  id: string;
  title?: string | null;
  image_url: string; // Desktop / Default image URL
  storage_key: string;
  mobile_image_url?: string | null; // Mobile image URL
  mobile_storage_key?: string | null;
  redirect_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePosterInput {
  title?: string;
  redirect_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdatePosterInput {
  title?: string | null;
  redirect_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}


// ─── Communication & Social Media ─────────────────────────────────────────────

export interface CompanyCommunication {
  id: string;
  whatsapp_number?: string | null;
  whatsapp_message?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  office_address?: string | null;
  updated_at: string;
}

export interface UpdateCompanyCommunicationInput {
  whatsapp_number?: string | null;
  whatsapp_message?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  office_address?: string | null;
}

