import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../../database/connection';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/AppError';
import { deleteFromR2 } from '../media/media.service';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFiltersInput,
} from '@rewa-bhoomi/validation';

// ─── Slug Generation ──────────────────────────────────────────────────────────

async function generateUniqueSlug(title: string, city: string): Promise<string> {
  const base = slugify(`${title} ${city}`, { lower: true, strict: true, trim: true });
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM properties WHERE slug = $1',
      [slug],
    );
    if (!existing) break;
    attempt++;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

// ─── List Properties ──────────────────────────────────────────────────────────

export async function listProperties(filters: PropertyFiltersInput, requestingUserId?: string) {
  const conditions: string[] = ['p.deleted_at IS NULL'];
  const params: unknown[] = [];
  let paramIdx = 1;

  // Default to PUBLISHED for public, allow admin to see all
  if (!filters.status) {
    conditions.push(`p.status = 'PUBLISHED'`);
  } else {
    conditions.push(`p.status = $${paramIdx}`);
    params.push(filters.status);
    paramIdx++;
  }

  if (filters.keyword) {
    conditions.push(
      `to_tsvector('english', p.title || ' ' || COALESCE(p.description, '') || ' ' || p.city || ' ' || p.state) @@ plainto_tsquery('english', $${paramIdx})`,
    );
    params.push(filters.keyword);
    paramIdx++;
  }

  if (filters.city) {
    conditions.push(`LOWER(p.city) = LOWER($${paramIdx})`);
    params.push(filters.city);
    paramIdx++;
  }

  if (filters.listingType) {
    conditions.push(`p.listing_type = $${paramIdx}`);
    params.push(filters.listingType);
    paramIdx++;
  }

  if (filters.listingPurpose) {
    conditions.push(`p.listing_purpose = $${paramIdx}`);
    params.push(filters.listingPurpose);
    paramIdx++;
  }

  if (filters.categoryType) {
    conditions.push(`p.category_type = $${paramIdx}`);
    params.push(filters.categoryType);
    paramIdx++;
  }

  if (filters.propertyType) {
    conditions.push(`p.property_type = $${paramIdx}`);
    params.push(filters.propertyType);
    paramIdx++;
  }

  if (filters.categoryId) {
    conditions.push(`p.category_id = $${paramIdx}`);
    params.push(filters.categoryId);
    paramIdx++;
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`COALESCE(p.price_amount, p.price) >= $${paramIdx}`);
    params.push(filters.minPrice);
    paramIdx++;
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`COALESCE(p.price_amount, p.price) <= $${paramIdx}`);
    params.push(filters.maxPrice);
    paramIdx++;
  }

  if (filters.minArea !== undefined) {
    conditions.push(`p.area >= $${paramIdx}`);
    params.push(filters.minArea);
    paramIdx++;
  }

  if (filters.maxArea !== undefined) {
    conditions.push(`p.area <= $${paramIdx}`);
    params.push(filters.maxArea);
    paramIdx++;
  }

  if (filters.bedrooms !== undefined) {
    conditions.push(`p.bedrooms >= $${paramIdx}`);
    params.push(filters.bedrooms);
    paramIdx++;
  }

  if (filters.bathrooms !== undefined) {
    conditions.push(`p.bathrooms >= $${paramIdx}`);
    params.push(filters.bathrooms);
    paramIdx++;
  }

  if (filters.furnishedStatus) {
    conditions.push(`p.furnished_status = $${paramIdx}`);
    params.push(filters.furnishedStatus);
    paramIdx++;
  }

  if (filters.constructionStatus) {
    conditions.push(`p.construction_status = $${paramIdx}`);
    params.push(filters.constructionStatus);
    paramIdx++;
  }

  if (filters.isPopular) {
    conditions.push(`p.is_popular = TRUE`);
  }

  // Cursor-based pagination
  if (filters.cursor) {
    conditions.push(`p.created_at < (SELECT created_at FROM properties WHERE id = $${paramIdx})`);
    params.push(filters.cursor);
    paramIdx++;
  }

  const sortMap: Record<string, string> = {
    newest:     'p.is_popular DESC, p.popular_rank ASC NULLS LAST, p.created_at DESC',
    oldest:     'p.created_at ASC',
    price_asc:  'p.price ASC',
    price_desc: 'p.price DESC',
    area_asc:   'p.area ASC',
    area_desc:  'p.area DESC',
    popular:    'p.is_popular DESC, p.popular_rank ASC NULLS LAST, p.created_at DESC',
  };

  const orderBy = sortMap[filters.sortBy ?? 'newest'] ?? sortMap.newest;
  const limit = Math.min(filters.limit ?? 20, 100);

  params.push(limit + 1); // fetch one extra to determine hasMore
  const limitParam = paramIdx;

  const sql = `
    SELECT
      p.id, p.slug, p.title, p.description,
      COALESCE(p.price_amount, p.price) AS price,
      COALESCE(p.price_amount, p.price) AS price_amount,
      p.price_type, p.billing_period, p.is_price_negotiable, p.price_per_sqft,
      p.listing_purpose, p.category_type, p.property_type, p.listing_type, p.status,
      COALESCE(pl.city, p.city) AS city,
      COALESCE(pl.state, p.state) AS state,
      COALESCE(pl.country, p.country) AS country,
      COALESCE(pl.address, p.address) AS address,
      COALESCE(pl.latitude, p.latitude) AS latitude,
      COALESCE(pl.longitude, p.longitude) AS longitude,
      p.area, p.area_unit,
      p.bedrooms, p.bathrooms, p.is_popular, p.created_at,
      pc.id AS category_id, pc.name AS category_name, pc.slug AS category_slug,
      u.id AS owner_id, u.name AS owner_name, u.avatar_url AS owner_avatar,
      (SELECT url FROM property_images WHERE property_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail,
      (SELECT ARRAY_AGG(url ORDER BY sort_order ASC) FROM property_images WHERE property_id = p.id) AS images,
      (SELECT COUNT(*)::int FROM property_images WHERE property_id = p.id) AS image_count
      ${requestingUserId ? `, EXISTS(SELECT 1 FROM favorites WHERE user_id = '${requestingUserId}' AND property_id = p.id) AS is_favorited` : ''}
    FROM properties p
    LEFT JOIN property_locations pl ON pl.property_id = p.id
    LEFT JOIN property_categories pc ON pc.id = p.category_id
    JOIN users u ON u.id = p.owner_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitParam}
  `;

  const rows = await query<Record<string, unknown>>(sql, params);
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  return {
    data,
    meta: {
      hasMore,
      limit,
      cursor: hasMore ? String(data[data.length - 1]?.id ?? '') : undefined,
    },
  };
}

// ─── Get Property by Slug ─────────────────────────────────────────────────────

export async function getPropertyBySlug(slug: string, requestingUserId?: string, isAdmin = false) {
  const property = await queryOne<Record<string, unknown>>(
    `SELECT
      p.*,
      pc.id AS category_id, pc.name AS category_name, pc.slug AS category_slug,
      u.id AS owner_id, u.name AS owner_name, u.avatar_url AS owner_avatar,
      u.phone AS owner_phone, u.username AS owner_username
      ${requestingUserId ? `, EXISTS(SELECT 1 FROM favorites WHERE user_id = '${requestingUserId}' AND property_id = p.id) AS is_favorited` : ''}
    FROM properties p
    LEFT JOIN property_categories pc ON pc.id = p.category_id
    JOIN users u ON u.id = p.owner_id
    WHERE p.slug = $1 AND p.deleted_at IS NULL`,
    [slug],
  );

  if (!property) throw new NotFoundError('Property not found');

  // Allow owners to preview their own PENDING/DRAFT listings
  // Everyone else only sees PUBLISHED properties
  if (property.status !== 'PUBLISHED') {
    const isOwner = requestingUserId && requestingUserId === property.owner_id;
    if (!isOwner && !isAdmin) throw new NotFoundError('Property not found or not yet published');
  }

  const propId = property.id as string;

  const [location, resDetails, commDetails, landDetails, pgDetails, leaseDetails, commLeaseDetails, hallDetails, images, amenities] = await Promise.all([
    queryOne('SELECT * FROM property_locations WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_residential_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_commercial_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_land_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_pg_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_lease_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_commercial_lease_details WHERE property_id = $1', [propId]),
    queryOne('SELECT * FROM property_hall_details WHERE property_id = $1', [propId]),
    query('SELECT id, url, storage_key, sort_order FROM property_images WHERE property_id = $1 ORDER BY sort_order', [propId]),
    query(`SELECT pa.id, pa.name, pa.icon FROM property_amenities pa JOIN property_amenity_mapping pam ON pam.amenity_id = pa.id WHERE pam.property_id = $1`, [propId]),
  ]);

  return {
    ...property,
    location: location || {
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      pincode: property.pincode,
      latitude: property.latitude,
      longitude: property.longitude,
    },
    residentialDetails: resDetails,
    commercialDetails: commDetails,
    landDetails: landDetails,
    pgDetails: pgDetails,
    leaseDetails: leaseDetails,
    commercialLeaseDetails: commLeaseDetails,
    hallDetails: hallDetails,
    images,
    amenities,
  };
}

// ─── Get Property by ID (for edit/ownership check) ──────────────────────────

export async function getPropertyById(id: string) {
  return queryOne<{ id: string; owner_id: string; status: string }>(
    'SELECT id, owner_id, status FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
}

// ─── Create Property ──────────────────────────────────────────────────────────

export async function createProperty(
  input: CreatePropertyInput,
  ownerId: string,
  createdByRole: 'USER' | 'ADMIN',
) {
  const city = input.location?.city ?? 'Rewa';
  const slug = await generateUniqueSlug(input.title, city);
  const status = createdByRole === 'ADMIN' ? 'PUBLISHED' : 'PENDING_REVIEW';

  return withTransaction(async (client) => {
    // 0. Fetch valid category_id from DB
    const catRes = await client.query<{ id: string }>(
      `SELECT id FROM property_categories ORDER BY sort_order ASC LIMIT 1`
    );
    const categoryId = catRes.rows[0]?.id || null;

    // 1. Insert Core Property
    const result = await client.query<{ id: string; slug: string }>(
      `INSERT INTO properties (
        slug, title, description, price, price_amount, price_type, billing_period,
        is_price_negotiable, price_per_sqft, listing_purpose, category_type, property_type,
        listing_type, owner_id, created_by, created_by_role,
        city, state, country, address, pincode, latitude, longitude,
        status, videos, category_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
      ) RETURNING id, slug`,
      [
        slug, input.title, input.description, input.priceAmount, input.priceAmount, input.priceType ?? 'TOTAL_PRICE', input.billingPeriod ?? null,
        input.isPriceNegotiable ?? false, input.pricePerSqFt ?? null, input.listingPurpose, input.categoryType, input.propertyType,
        input.listingPurpose === 'SALE' ? 'SELL' : input.listingPurpose === 'RENT' ? 'RENT' : 'LEASE',
        ownerId, ownerId, createdByRole,
        input.location.city, input.location.state, input.location.country ?? 'India', input.location.address ?? null,
        input.location.pincode ?? null, input.location.latitude ?? null, input.location.longitude ?? null,
        status, input.videos ?? [], categoryId
      ],
    );

    const propertyId = result.rows[0].id;

    // 2. Insert Location Record
    await client.query(
      `INSERT INTO property_locations (
        property_id, address, locality, city, district, state, country, pincode, latitude, longitude, google_maps_link
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        propertyId, input.location.address ?? null, input.location.locality ?? null,
        input.location.city, input.location.district ?? null, input.location.state,
        input.location.country ?? 'India', input.location.pincode ?? null,
        input.location.latitude ?? null, input.location.longitude ?? null,
        (input.location as any).googleMapsLink ?? null,
      ],
    );

    // 3. Insert Domain Extension Details
    if (input.residentialDetails && Object.keys(input.residentialDetails).length > 0) {
      const rd = input.residentialDetails as any;
      await client.query(
        `INSERT INTO property_residential_details (
          property_id, bedrooms, bathrooms, balconies, built_up_area, carpet_area, plot_area,
          property_age, floor, total_floors, furnished_status, parking, facing, water_supply, possession_status, road_width, tenant_preference
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          propertyId, rd.bedrooms ?? null, rd.bathrooms ?? null, rd.balconies ?? null, rd.builtUpArea ?? null, rd.carpetArea ?? null, rd.plotArea ?? null,
          rd.propertyAge ?? null, rd.floor ?? null, rd.totalFloors ?? null, rd.furnishedStatus ?? null, rd.parking ?? null, rd.facing ?? null, rd.waterSupply ?? null, rd.possessionStatus ?? null, rd.roadWidth ?? null, rd.tenantPreference ?? null,
        ],
      );
    }

    if (input.commercialDetails && Object.keys(input.commercialDetails).length > 0) {
      const cd = input.commercialDetails as any;
      await client.query(
        `INSERT INTO property_commercial_details (
          property_id, carpet_area, built_up_area, frontage, depth, floor, total_floors, washrooms, parking, lift, power_backup, air_conditioning, main_road_facing, corner_property, road_width
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          propertyId, cd.carpetArea ?? null, cd.builtUpArea ?? null, cd.frontage ?? null, cd.depth ?? null, cd.floor ?? null, cd.totalFloors ?? null, cd.washrooms ?? null, cd.parking ?? null, cd.lift ?? false, cd.powerBackup ?? false, cd.airConditioning ?? false, cd.mainRoadFacing ?? false, cd.cornerProperty ?? false, cd.roadWidth ?? null,
        ],
      );
    }

    if (input.landDetails && Object.keys(input.landDetails).length > 0) {
      const ld = input.landDetails as any;
      await client.query(
        `INSERT INTO property_land_details (
          property_id, total_land_area, area_unit, land_type, irrigation_available, water_source, borewell, tube_well, canal, river_access, electricity_connection, road_access, soil_type, current_crop, fencing, farm_house, nearest_road_distance, nearest_village, nearest_city, plot_length, plot_width
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          propertyId, ld.totalLandArea ?? 0, ld.areaUnit ?? 'SQ_FT', ld.landType ?? null, ld.irrigationAvailable ?? false, ld.waterSource ?? null, ld.borewell ?? false, ld.tubeWell ?? false, ld.canal ?? false, ld.riverAccess ?? false, ld.electricityConnection ?? false, ld.roadAccess ?? false, ld.soilType ?? null, ld.currentCrop ?? null, ld.fencing ?? false, ld.farmHouse ?? false, ld.nearestRoadDistance ?? null, ld.nearestVillage ?? null, ld.nearestCity ?? null, ld.plotLength ?? null, ld.plotWidth ?? null,
        ],
      );
    }

    if (input.pgDetails && Object.keys(input.pgDetails).length > 0) {
      const pg = input.pgDetails as any;
      await client.query(
        `INSERT INTO property_pg_details (
          property_id, pg_name, room_type, occupancy, gender_preference, available_from, monthly_rent, security_deposit, food_charges, electricity_charges, maintenance_charges, food_available, meal_plan, smoking_allowed, alcohol_allowed, visitors_allowed, pets_allowed, curfew_time, minimum_stay_months, notice_period_days
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          propertyId, pg.pgName ?? null, pg.roomType ?? 'SINGLE', pg.occupancy ?? null, pg.genderPreference ?? 'ANY', pg.availableFrom ?? null, pg.monthlyRent ?? input.priceAmount, pg.securityDeposit ?? null, pg.foodCharges ?? null, pg.electricityCharges ?? null, pg.maintenanceCharges ?? null, pg.foodAvailable ?? false, pg.mealPlan ?? null, pg.smokingAllowed ?? false, pg.alcoholAllowed ?? false, pg.visitorsAllowed ?? false, pg.petsAllowed ?? false, pg.curfewTime ?? null, pg.minimumStayMonths ?? null, pg.noticePeriodDays ?? null,
        ],
      );
    }

    if (input.leaseDetails && Object.keys(input.leaseDetails).length > 0) {
      const ld = input.leaseDetails as any;
      await client.query(
        `INSERT INTO property_lease_details (
          property_id, lease_amount, lease_payment_type, security_deposit, lease_duration_years, lock_in_period_months, notice_period_days, available_from, maintenance_responsibility, electricity_responsibility, water_responsibility, renewal_option, terms_conditions
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          propertyId, ld.leaseAmount ?? input.priceAmount, ld.leasePaymentType ?? 'MONTHLY', ld.securityDeposit ?? null, ld.leaseDurationYears ?? null, ld.lockInPeriodMonths ?? null, ld.noticePeriodDays ?? null, ld.availableFrom ?? null, ld.maintenanceResponsibility ?? null, ld.electricityResponsibility ?? null, ld.waterResponsibility ?? null, ld.renewalOption ?? true, ld.termsConditions ?? null,
        ],
      );
    }

    if (input.commercialLeaseDetails && Object.keys(input.commercialLeaseDetails).length > 0) {
      const cld = input.commercialLeaseDetails as any;
      await client.query(
        `INSERT INTO property_commercial_lease_details (
          property_id, monthly_lease_rent, security_deposit, lease_duration_years, lock_in_period_months, notice_period_days, maintenance_cost, cam_cost, electricity_cost, water_cost, parking_spaces, available_from, renewal_terms, rent_escalation_percentage, escalation_period_months, allowed_business_types, fire_safety_certified, power_load_kw, loading_unloading_facility
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          propertyId, cld.monthlyLeaseRent ?? input.priceAmount, cld.securityDeposit ?? null, cld.leaseDurationYears ?? null, cld.lockInPeriodMonths ?? null, cld.noticePeriodDays ?? null, cld.maintenanceCost ?? null, cld.camCost ?? null, cld.electricityCost ?? null, cld.waterCost ?? null, cld.parkingSpaces ?? null, cld.availableFrom ?? null, cld.renewalTerms ?? null, cld.rentEscalationPercentage ?? null, cld.escalationPeriodMonths ?? null, cld.allowedBusinessTypes ?? [], cld.fireSafetyCertified ?? false, cld.powerLoadKw ?? null, cld.loadingUnloadingFacility ?? false,
        ],
      );
    }

    if (input.hallDetails && Object.keys(input.hallDetails).length > 0) {
      const hd = input.hallDetails as any;
      await client.query(
        `INSERT INTO property_hall_details (
          property_id, hall_type, capacity_people, seating_capacity, hall_area_sqft, parking_capacity_vehicles, ac_available, kitchen_available, stage_available, dining_area_available, washrooms_count, sound_system_available, generator_backup_available, catering_available, pricing_type, price_rate, security_deposit
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          propertyId, hd.hallType ?? null, hd.capacityPeople ?? null, hd.seatingCapacity ?? null, hd.hallAreaSqFt ?? null, hd.parkingCapacityVehicles ?? null, hd.acAvailable ?? false, hd.kitchenAvailable ?? false, hd.stageAvailable ?? false, hd.diningAreaAvailable ?? false, hd.washroomsCount ?? null, hd.soundSystemAvailable ?? false, hd.generatorBackupAvailable ?? false, hd.cateringAvailable ?? false, hd.pricingType ?? 'PER_DAY', hd.priceRate ?? input.priceAmount, hd.securityDeposit ?? null,
        ],
      );
    }

    // 4. Insert Amenities
    if (input.amenityIds?.length) {
      const values = input.amenityIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO property_amenity_mapping (property_id, amenity_id) VALUES ${values}`,
        [propertyId, ...input.amenityIds],
      );
    }

    // 5. Insert Images
    if (input.imageUrls?.length) {
      const keys = input.imageStorageKeys || [];
      for (let i = 0; i < input.imageUrls.length; i++) {
        await client.query(
          `INSERT INTO property_images (property_id, storage_key, url, sort_order) VALUES ($1, $2, $3, $4)`,
          [propertyId, keys[i] || `key_${Date.now()}_${i}`, input.imageUrls[i], i],
        );
      }
    }

    return result.rows[0];
  });
}

// ─── Update Property ──────────────────────────────────────────────────────────

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
  requesterId: string,
  requesterRoles: string[],
) {
  const property = await getPropertyById(id);
  if (!property) throw new NotFoundError('Property not found');

  const isAdmin = requesterRoles.includes('ADMIN') || requesterRoles.includes('SUPER_ADMIN');
  if (!isAdmin && property.owner_id !== requesterId) {
    throw new ForbiddenError('You can only edit your own properties');
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fields: [string, unknown][] = [
    ['title', input.title],
    ['description', input.description],
    ['price_amount', input.priceAmount],
    ['price', input.priceAmount],
    ['price_type', input.priceType],
    ['billing_period', input.billingPeriod],
    ['is_price_negotiable', input.isPriceNegotiable],
    ['price_per_sqft', input.pricePerSqFt],
    ['listing_purpose', input.listingPurpose],
    ['category_type', input.categoryType],
    ['property_type', input.propertyType],
  ];

  if (input.location) {
    fields.push(
      ['city', input.location.city],
      ['state', input.location.state],
      ['country', input.location.country],
      ['address', input.location.address],
      ['pincode', input.location.pincode],
      ['latitude', input.location.latitude],
      ['longitude', input.location.longitude],
    );

    // Update location table
    await query(
      `INSERT INTO property_locations (property_id, address, locality, city, district, state, country, pincode, latitude, longitude, google_maps_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (property_id) DO UPDATE SET
        address = EXCLUDED.address, locality = EXCLUDED.locality, city = EXCLUDED.city,
        district = EXCLUDED.district, state = EXCLUDED.state, country = EXCLUDED.country,
        pincode = EXCLUDED.pincode, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
        google_maps_link = EXCLUDED.google_maps_link`,
      [
        id, input.location.address ?? null, input.location.locality ?? null,
        input.location.city, input.location.district ?? null, input.location.state,
        input.location.country ?? 'India', input.location.pincode ?? null,
        input.location.latitude ?? null, input.location.longitude ?? null,
        (input.location as any).googleMapsLink ?? null,
      ]
    );
  }

  if (input.residentialDetails) {
    const rd = input.residentialDetails as any;
    await query(
      `INSERT INTO property_residential_details (
        property_id, bedrooms, bathrooms, balconies, built_up_area, carpet_area, plot_area,
        property_age, floor, total_floors, furnished_status, parking, facing, water_supply, possession_status, road_width, tenant_preference
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (property_id) DO UPDATE SET
        bedrooms = EXCLUDED.bedrooms, bathrooms = EXCLUDED.bathrooms, balconies = EXCLUDED.balconies,
        built_up_area = EXCLUDED.built_up_area, carpet_area = EXCLUDED.carpet_area, plot_area = EXCLUDED.plot_area,
        property_age = EXCLUDED.property_age, floor = EXCLUDED.floor, total_floors = EXCLUDED.total_floors,
        furnished_status = EXCLUDED.furnished_status, parking = EXCLUDED.parking, facing = EXCLUDED.facing,
        water_supply = EXCLUDED.water_supply, possession_status = EXCLUDED.possession_status, road_width = EXCLUDED.road_width,
        tenant_preference = EXCLUDED.tenant_preference`,
      [
        id, rd.bedrooms ?? null, rd.bathrooms ?? null, rd.balconies ?? null, rd.builtUpArea ?? null, rd.carpetArea ?? null, rd.plotArea ?? null,
        rd.propertyAge ?? null, rd.floor ?? null, rd.totalFloors ?? null, rd.furnishedStatus ?? null, rd.parking ?? null, rd.facing ?? null, rd.waterSupply ?? null, rd.possessionStatus ?? null, rd.roadWidth ?? null, rd.tenantPreference ?? null,
      ]
    );
  }

  if (input.landDetails) {
    const ld = input.landDetails as any;
    await query(
      `INSERT INTO property_land_details (
        property_id, total_land_area, area_unit, land_type, irrigation_available, soil_type, current_crop,
        fencing, farm_house, nearest_road_distance, nearest_village, nearest_city, plot_length, plot_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (property_id) DO UPDATE SET
        total_land_area = EXCLUDED.total_land_area, area_unit = EXCLUDED.area_unit, land_type = EXCLUDED.land_type,
        irrigation_available = EXCLUDED.irrigation_available, soil_type = EXCLUDED.soil_type, current_crop = EXCLUDED.current_crop,
        fencing = EXCLUDED.fencing, farm_house = EXCLUDED.farm_house, nearest_road_distance = EXCLUDED.nearest_road_distance,
        nearest_village = EXCLUDED.nearest_village, nearest_city = EXCLUDED.nearest_city,
        plot_length = EXCLUDED.plot_length, plot_width = EXCLUDED.plot_width`,
      [
        id, ld.totalLandArea ?? 0, ld.areaUnit ?? 'SQ_FT', ld.landType ?? null, ld.irrigationAvailable ?? false,
        ld.soilType ?? null, ld.currentCrop ?? null, ld.fencing ?? false, ld.farmHouse ?? false,
        ld.nearestRoadDistance ?? null, ld.nearestVillage ?? null, ld.nearestCity ?? null,
        ld.plotLength ?? null, ld.plotWidth ?? null,
      ]
    );
  }

  if (input.commercialDetails) {
    const cd = input.commercialDetails as any;
    await query(
      `INSERT INTO property_commercial_details (
        property_id, carpet_area, built_up_area, frontage, depth, floor, total_floors, washrooms, parking, lift, power_backup, air_conditioning, main_road_facing, corner_property, road_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (property_id) DO UPDATE SET
        carpet_area = EXCLUDED.carpet_area, built_up_area = EXCLUDED.built_up_area, frontage = EXCLUDED.frontage, depth = EXCLUDED.depth, floor = EXCLUDED.floor, total_floors = EXCLUDED.total_floors, washrooms = EXCLUDED.washrooms, parking = EXCLUDED.parking, lift = EXCLUDED.lift, power_backup = EXCLUDED.power_backup, air_conditioning = EXCLUDED.air_conditioning, main_road_facing = EXCLUDED.main_road_facing, corner_property = EXCLUDED.corner_property, road_width = EXCLUDED.road_width`,
      [
        id, cd.carpetArea ?? null, cd.builtUpArea ?? null, cd.frontage ?? null, cd.depth ?? null, cd.floor ?? null, cd.totalFloors ?? null, cd.washrooms ?? null, cd.parking ?? null, cd.lift ?? false, cd.powerBackup ?? false, cd.airConditioning ?? false, cd.mainRoadFacing ?? false, cd.cornerProperty ?? false, cd.roadWidth ?? null,
      ]
    );
  }

  if (input.pgDetails) {
    const pg = input.pgDetails as any;
    await query(
      `INSERT INTO property_pg_details (
        property_id, pg_name, room_type, occupancy, gender_preference, available_from, monthly_rent, security_deposit, food_charges, electricity_charges, maintenance_charges, food_available, meal_plan, smoking_allowed, alcohol_allowed, visitors_allowed, pets_allowed, curfew_time, minimum_stay_months, notice_period_days
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (property_id) DO UPDATE SET
        pg_name = EXCLUDED.pg_name, room_type = EXCLUDED.room_type, occupancy = EXCLUDED.occupancy, gender_preference = EXCLUDED.gender_preference, available_from = EXCLUDED.available_from, monthly_rent = EXCLUDED.monthly_rent, security_deposit = EXCLUDED.security_deposit, food_charges = EXCLUDED.food_charges, electricity_charges = EXCLUDED.electricity_charges, maintenance_charges = EXCLUDED.maintenance_charges, food_available = EXCLUDED.food_available, meal_plan = EXCLUDED.meal_plan, smoking_allowed = EXCLUDED.smoking_allowed, alcohol_allowed = EXCLUDED.alcohol_allowed, visitors_allowed = EXCLUDED.visitors_allowed, pets_allowed = EXCLUDED.pets_allowed, curfew_time = EXCLUDED.curfew_time, minimum_stay_months = EXCLUDED.minimum_stay_months, notice_period_days = EXCLUDED.notice_period_days`,
      [
        id, pg.pgName ?? null, pg.roomType ?? 'SINGLE', pg.occupancy ?? null, pg.genderPreference ?? 'ANY', pg.availableFrom ?? null, pg.monthlyRent ?? input.priceAmount, pg.securityDeposit ?? null, pg.foodCharges ?? null, pg.electricityCharges ?? null, pg.maintenanceCharges ?? null, pg.foodAvailable ?? false, pg.mealPlan ?? null, pg.smokingAllowed ?? false, pg.alcoholAllowed ?? false, pg.visitorsAllowed ?? false, pg.petsAllowed ?? false, pg.curfewTime ?? null, pg.minimumStayMonths ?? null, pg.noticePeriodDays ?? null,
      ]
    );
  }

  if (input.leaseDetails) {
    const ld = input.leaseDetails as any;
    await query(
      `INSERT INTO property_lease_details (
        property_id, lease_amount, lease_payment_type, security_deposit, lease_duration_years, lock_in_period_months, notice_period_days, available_from, maintenance_responsibility, electricity_responsibility, water_responsibility, renewal_option, terms_conditions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (property_id) DO UPDATE SET
        lease_amount = EXCLUDED.lease_amount, lease_payment_type = EXCLUDED.lease_payment_type, security_deposit = EXCLUDED.security_deposit, lease_duration_years = EXCLUDED.lease_duration_years, lock_in_period_months = EXCLUDED.lock_in_period_months, notice_period_days = EXCLUDED.notice_period_days, available_from = EXCLUDED.available_from, maintenance_responsibility = EXCLUDED.maintenance_responsibility, electricity_responsibility = EXCLUDED.electricity_responsibility, water_responsibility = EXCLUDED.water_responsibility, renewal_option = EXCLUDED.renewal_option, terms_conditions = EXCLUDED.terms_conditions`,
      [
        id, ld.leaseAmount ?? input.priceAmount, ld.leasePaymentType ?? 'MONTHLY', ld.securityDeposit ?? null, ld.leaseDurationYears ?? null, ld.lockInPeriodMonths ?? null, ld.noticePeriodDays ?? null, ld.availableFrom ?? null, ld.maintenanceResponsibility ?? null, ld.electricityResponsibility ?? null, ld.waterResponsibility ?? null, ld.renewalOption ?? true, ld.termsConditions ?? null,
      ]
    );
  }

  if (input.commercialLeaseDetails) {
    const cld = input.commercialLeaseDetails as any;
    await query(
      `INSERT INTO property_commercial_lease_details (
        property_id, lock_in_period_months, rent_escalation_percentage, maintenance_charges, deposit_months, permitted_uses, restrictions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (property_id) DO UPDATE SET
        lock_in_period_months = EXCLUDED.lock_in_period_months, rent_escalation_percentage = EXCLUDED.rent_escalation_percentage, maintenance_charges = EXCLUDED.maintenance_charges, deposit_months = EXCLUDED.deposit_months, permitted_uses = EXCLUDED.permitted_uses, restrictions = EXCLUDED.restrictions`,
      [
        id, cld.lockInPeriodMonths ?? null, cld.rentEscalationPercentage ?? null, cld.maintenanceCharges ?? null, cld.depositMonths ?? null, cld.permittedUses ?? null, cld.restrictions ?? null,
      ]
    );
  }

  if (input.hallDetails) {
    const hd = input.hallDetails as any;
    await query(
      `INSERT INTO property_hall_details (
        property_id, seating_capacity, floating_capacity, dining_capacity, per_plate_cost_veg, per_plate_cost_non_veg, decoration_allowed, outside_catering_allowed, liquor_allowed, parking_capacity, ac_available, rooms_available, event_types
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (property_id) DO UPDATE SET
        seating_capacity = EXCLUDED.seating_capacity, floating_capacity = EXCLUDED.floating_capacity, dining_capacity = EXCLUDED.dining_capacity, per_plate_cost_veg = EXCLUDED.per_plate_cost_veg, per_plate_cost_non_veg = EXCLUDED.per_plate_cost_non_veg, decoration_allowed = EXCLUDED.decoration_allowed, outside_catering_allowed = EXCLUDED.outside_catering_allowed, liquor_allowed = EXCLUDED.liquor_allowed, parking_capacity = EXCLUDED.parking_capacity, ac_available = EXCLUDED.ac_available, rooms_available = EXCLUDED.rooms_available, event_types = EXCLUDED.event_types`,
      [
        id, hd.seatingCapacity ?? null, hd.floatingCapacity ?? null, hd.diningCapacity ?? null, hd.perPlateCostVeg ?? null, hd.perPlateCostNonVeg ?? null, hd.decorationAllowed ?? true, hd.outsideCateringAllowed ?? false, hd.liquorAllowed ?? false, hd.parkingCapacity ?? null, hd.acAvailable ?? false, hd.roomsAvailable ?? null, hd.eventTypes ?? null,
      ]
    );
  }


  for (const [col, val] of fields) {
    if (val !== undefined) {
      updates.push(`${col} = $${idx}`);
      params.push(val);
      idx++;
    }
  }

  if (updates.length === 0 && !input.amenityIds) {
    throw new BadRequestError('No fields to update');
  }

  if (updates.length > 0) {
    params.push(id);
    await query(
      `UPDATE properties SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      params,
    );
  }

  if (input.amenityIds !== undefined) {
    await query('DELETE FROM property_amenity_mapping WHERE property_id = $1', [id]);
    if (input.amenityIds.length > 0) {
      const values = input.amenityIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO property_amenity_mapping (property_id, amenity_id) VALUES ${values}`,
        [id, ...input.amenityIds],
      );
    }
  }

  if (input.imageUrls !== undefined) {
    await query('DELETE FROM property_images WHERE property_id = $1', [id]);
    if (input.imageUrls.length > 0) {
      for (let i = 0; i < input.imageUrls.length; i++) {
        await query(
          `INSERT INTO property_images (property_id, storage_key, url, sort_order) VALUES ($1, $2, $3, $4)`,
          [id, `auto_${Date.now()}_${i}`, input.imageUrls[i], i]
        );
      }
    }
  }

  return getPropertyBySlug(
    (await queryOne<{ slug: string }>('SELECT slug FROM properties WHERE id = $1', [id]))!.slug,
    requesterId,
    isAdmin
  );
}

// ─── Delete Property (soft delete) ───────────────────────────────────────────

export async function deleteProperty(
  id: string,
  requesterId: string,
  requesterRoles: string[],
) {
  const property = await getPropertyById(id);
  if (!property) throw new NotFoundError('Property not found');

  const isAdmin = requesterRoles.includes('ADMIN') || requesterRoles.includes('SUPER_ADMIN');
  if (!isAdmin && property.owner_id !== requesterId) {
    throw new ForbiddenError('You can only delete your own properties');
  }

  // Fetch images to delete from R2
  const images = await query<{ storage_key: string }>(
    'SELECT storage_key FROM property_images WHERE property_id = $1',
    [id],
  );

  for (const img of images) {
    if (img.storage_key && !img.storage_key.startsWith('auto_')) {
      try {
        await deleteFromR2(img.storage_key);
      } catch (err) {
        console.error(`Failed to delete R2 key ${img.storage_key}:`, err);
      }
    }
  }

  await query('UPDATE properties SET deleted_at = NOW() WHERE id = $1', [id]);
}

// ─── Toggle Favorite ─────────────────────────────────────────────────────────

export async function addFavorite(userId: string, propertyId: string) {
  const property = await queryOne<{ id: string }>(
    `SELECT id FROM properties WHERE id = $1 AND status = 'PUBLISHED' AND deleted_at IS NULL`,
    [propertyId],
  );
  if (!property) throw new NotFoundError('Property not found');

  await query(
    'INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, propertyId],
  );
}

export async function removeFavorite(userId: string, propertyId: string) {
  await query(
    'DELETE FROM favorites WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId],
  );
}

export async function getUserFavorites(userId: string, cursor?: string, limit = 20) {
  const conditions = ['f.user_id = $1', 'p.deleted_at IS NULL', `p.status = 'PUBLISHED'`];
  const params: unknown[] = [userId];

  if (cursor) {
    conditions.push(`f.created_at < (SELECT created_at FROM favorites WHERE user_id = $1 AND property_id = $2)`);
    params.push(cursor);
  }

  params.push(limit + 1);

  const rows = await query<Record<string, unknown>>(
    `SELECT
      p.id, p.slug, p.title, p.description, p.price, p.listing_type, p.city, p.state,
      p.area, p.area_unit, p.bedrooms, p.bathrooms, p.created_at,
      pc.name AS category_name,
      u.name AS owner_name, u.avatar_url AS owner_avatar,
      (SELECT url FROM property_images WHERE property_id = p.id ORDER BY sort_order LIMIT 1) AS thumbnail,
      (SELECT ARRAY_AGG(url ORDER BY sort_order ASC) FROM property_images WHERE property_id = p.id) AS images,
      (SELECT COUNT(*)::int FROM property_images WHERE property_id = p.id) AS image_count,
      TRUE AS is_favorited,
      f.created_at AS favorited_at
     FROM favorites f
     JOIN properties p ON p.id = f.property_id
     JOIN property_categories pc ON pc.id = p.category_id
     LEFT JOIN users u ON u.id = p.owner_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY f.created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  return {
    data,
    meta: { hasMore, limit, cursor: hasMore ? String(data[data.length - 1]?.property_id ?? '') : undefined },
  };
}

// ─── Admin: Moderate Property ─────────────────────────────────────────────────

export async function moderateProperty(
  id: string,
  status: 'PUBLISHED' | 'REJECTED',
  rejectionReason?: string,
) {
  const property = await getPropertyById(id);
  if (!property) throw new NotFoundError('Property not found');

  await query(
    `UPDATE properties SET
      status = $1,
      rejection_reason = $2,
      published_at = CASE WHEN $1 = 'PUBLISHED' THEN NOW() ELSE published_at END,
      is_popular = CASE WHEN $1 != 'PUBLISHED' THEN FALSE ELSE is_popular END,
      updated_at = NOW()
     WHERE id = $3`,
    [status, rejectionReason ?? null, id],
  );
}

// ─── Admin: Set Popular ───────────────────────────────────────────────────────

export async function setPropertyPopular(
  id: string,
  isPopular: boolean,
  popularRank?: number,
) {
  const property = await queryOne<{ status: string }>('SELECT status FROM properties WHERE id = $1', [id]);
  if (!property) throw new NotFoundError('Property not found');
  if (property.status !== 'PUBLISHED' && isPopular) {
    throw new Error('Only published properties can be marked as popular');
  }

  await query(
    'UPDATE properties SET is_popular = $1, popular_rank = $2, updated_at = NOW() WHERE id = $3',
    [isPopular, isPopular ? (popularRank ?? null) : null, id],
  );
}

// ─── Get User's Own Properties ────────────────────────────────────────────────

export async function getUserProperties(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT
        p.id, p.slug, p.title, p.price, p.listing_type, p.status,
        p.city, p.state, p.created_at, p.updated_at,
        pc.name AS category_name,
        (SELECT url FROM property_images WHERE property_id = p.id ORDER BY sort_order LIMIT 1) AS thumbnail
       FROM properties p
       JOIN property_categories pc ON pc.id = p.category_id
       WHERE p.owner_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) AS count FROM properties WHERE owner_id = $1 AND deleted_at IS NULL',
      [userId],
    ),
  ]);

  return {
    data: rows,
    meta: {
      total: parseInt(countResult?.count ?? '0'),
      page,
      limit,
      hasMore: offset + rows.length < parseInt(countResult?.count ?? '0'),
    },
  };
}

// ─── Get Categories ───────────────────────────────────────────────────────────

export async function getCategories() {
  return query<{ id: string; name: string; slug: string; icon: string }>(
    'SELECT id, name, slug, icon FROM property_categories ORDER BY sort_order',
  );
}

export async function getAmenities() {
  return query<{ id: string; name: string; icon: string }>(
    'SELECT id, name, icon FROM property_amenities ORDER BY name',
  );
}
