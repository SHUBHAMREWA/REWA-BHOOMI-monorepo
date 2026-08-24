const fs = require('fs');

const file = 'apps/api/src/modules/properties/property.service.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  if (input.landDetails) {
    const ld = input.landDetails as any;
    await query(
      \`INSERT INTO property_land_details (
        property_id, total_land_area, area_unit, land_type, irrigation_available, soil_type, current_crop,
        fencing, farm_house, nearest_road_distance, nearest_village, nearest_city, plot_length, plot_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (property_id) DO UPDATE SET
        total_land_area = EXCLUDED.total_land_area, area_unit = EXCLUDED.area_unit, land_type = EXCLUDED.land_type,
        irrigation_available = EXCLUDED.irrigation_available, soil_type = EXCLUDED.soil_type, current_crop = EXCLUDED.current_crop,
        fencing = EXCLUDED.fencing, farm_house = EXCLUDED.farm_house, nearest_road_distance = EXCLUDED.nearest_road_distance,
        nearest_village = EXCLUDED.nearest_village, nearest_city = EXCLUDED.nearest_city,
        plot_length = EXCLUDED.plot_length, plot_width = EXCLUDED.plot_width\`,
      [
        id, ld.totalLandArea ?? null, ld.areaUnit ?? 'SQ_FT', ld.landType ?? null, ld.irrigationAvailable ?? false,
        ld.soilType ?? null, ld.currentCrop ?? null, ld.fencing ?? false, ld.farmHouse ?? false,
        ld.nearestRoadDistance ?? null, ld.nearestVillage ?? null, ld.nearestCity ?? null,
        ld.plotLength ?? null, ld.plotWidth ?? null,
      ]
    );
  }`;

const replaceStr = `  if (input.landDetails) {
    const ld = input.landDetails as any;
    await query(
      \`INSERT INTO property_land_details (
        property_id, total_land_area, area_unit, land_type, irrigation_available, soil_type, current_crop,
        fencing, farm_house, nearest_road_distance, nearest_village, nearest_city, plot_length, plot_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (property_id) DO UPDATE SET
        total_land_area = EXCLUDED.total_land_area, area_unit = EXCLUDED.area_unit, land_type = EXCLUDED.land_type,
        irrigation_available = EXCLUDED.irrigation_available, soil_type = EXCLUDED.soil_type, current_crop = EXCLUDED.current_crop,
        fencing = EXCLUDED.fencing, farm_house = EXCLUDED.farm_house, nearest_road_distance = EXCLUDED.nearest_road_distance,
        nearest_village = EXCLUDED.nearest_village, nearest_city = EXCLUDED.nearest_city,
        plot_length = EXCLUDED.plot_length, plot_width = EXCLUDED.plot_width\`,
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
      \`INSERT INTO property_commercial_details (
        property_id, carpet_area, built_up_area, frontage, depth, floor, total_floors, washrooms, parking, lift, power_backup, air_conditioning, main_road_facing, corner_property, road_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (property_id) DO UPDATE SET
        carpet_area = EXCLUDED.carpet_area, built_up_area = EXCLUDED.built_up_area, frontage = EXCLUDED.frontage, depth = EXCLUDED.depth, floor = EXCLUDED.floor, total_floors = EXCLUDED.total_floors, washrooms = EXCLUDED.washrooms, parking = EXCLUDED.parking, lift = EXCLUDED.lift, power_backup = EXCLUDED.power_backup, air_conditioning = EXCLUDED.air_conditioning, main_road_facing = EXCLUDED.main_road_facing, corner_property = EXCLUDED.corner_property, road_width = EXCLUDED.road_width\`,
      [
        id, cd.carpetArea ?? null, cd.builtUpArea ?? null, cd.frontage ?? null, cd.depth ?? null, cd.floor ?? null, cd.totalFloors ?? null, cd.washrooms ?? null, cd.parking ?? null, cd.lift ?? false, cd.powerBackup ?? false, cd.airConditioning ?? false, cd.mainRoadFacing ?? false, cd.cornerProperty ?? false, cd.roadWidth ?? null,
      ]
    );
  }

  if (input.pgDetails) {
    const pg = input.pgDetails as any;
    await query(
      \`INSERT INTO property_pg_details (
        property_id, pg_name, room_type, occupancy, gender_preference, available_from, monthly_rent, security_deposit, food_charges, electricity_charges, maintenance_charges, food_available, meal_plan, smoking_allowed, alcohol_allowed, visitors_allowed, pets_allowed, curfew_time, minimum_stay_months, notice_period_days
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (property_id) DO UPDATE SET
        pg_name = EXCLUDED.pg_name, room_type = EXCLUDED.room_type, occupancy = EXCLUDED.occupancy, gender_preference = EXCLUDED.gender_preference, available_from = EXCLUDED.available_from, monthly_rent = EXCLUDED.monthly_rent, security_deposit = EXCLUDED.security_deposit, food_charges = EXCLUDED.food_charges, electricity_charges = EXCLUDED.electricity_charges, maintenance_charges = EXCLUDED.maintenance_charges, food_available = EXCLUDED.food_available, meal_plan = EXCLUDED.meal_plan, smoking_allowed = EXCLUDED.smoking_allowed, alcohol_allowed = EXCLUDED.alcohol_allowed, visitors_allowed = EXCLUDED.visitors_allowed, pets_allowed = EXCLUDED.pets_allowed, curfew_time = EXCLUDED.curfew_time, minimum_stay_months = EXCLUDED.minimum_stay_months, notice_period_days = EXCLUDED.notice_period_days\`,
      [
        id, pg.pgName ?? null, pg.roomType ?? 'SINGLE', pg.occupancy ?? null, pg.genderPreference ?? 'ANY', pg.availableFrom ?? null, pg.monthlyRent ?? input.priceAmount, pg.securityDeposit ?? null, pg.foodCharges ?? null, pg.electricityCharges ?? null, pg.maintenanceCharges ?? null, pg.foodAvailable ?? false, pg.mealPlan ?? null, pg.smokingAllowed ?? false, pg.alcoholAllowed ?? false, pg.visitorsAllowed ?? false, pg.petsAllowed ?? false, pg.curfewTime ?? null, pg.minimumStayMonths ?? null, pg.noticePeriodDays ?? null,
      ]
    );
  }

  if (input.leaseDetails) {
    const ld = input.leaseDetails as any;
    await query(
      \`INSERT INTO property_lease_details (
        property_id, lease_amount, lease_payment_type, security_deposit, lease_duration_years, lock_in_period_months, notice_period_days, available_from, maintenance_responsibility, electricity_responsibility, water_responsibility, renewal_option, terms_conditions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (property_id) DO UPDATE SET
        lease_amount = EXCLUDED.lease_amount, lease_payment_type = EXCLUDED.lease_payment_type, security_deposit = EXCLUDED.security_deposit, lease_duration_years = EXCLUDED.lease_duration_years, lock_in_period_months = EXCLUDED.lock_in_period_months, notice_period_days = EXCLUDED.notice_period_days, available_from = EXCLUDED.available_from, maintenance_responsibility = EXCLUDED.maintenance_responsibility, electricity_responsibility = EXCLUDED.electricity_responsibility, water_responsibility = EXCLUDED.water_responsibility, renewal_option = EXCLUDED.renewal_option, terms_conditions = EXCLUDED.terms_conditions\`,
      [
        id, ld.leaseAmount ?? input.priceAmount, ld.leasePaymentType ?? 'MONTHLY', ld.securityDeposit ?? null, ld.leaseDurationYears ?? null, ld.lockInPeriodMonths ?? null, ld.noticePeriodDays ?? null, ld.availableFrom ?? null, ld.maintenanceResponsibility ?? null, ld.electricityResponsibility ?? null, ld.waterResponsibility ?? null, ld.renewalOption ?? true, ld.termsConditions ?? null,
      ]
    );
  }

  if (input.commercialLeaseDetails) {
    const cld = input.commercialLeaseDetails as any;
    await query(
      \`INSERT INTO property_commercial_lease_details (
        property_id, lock_in_period_months, rent_escalation_percentage, maintenance_charges, deposit_months, permitted_uses, restrictions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (property_id) DO UPDATE SET
        lock_in_period_months = EXCLUDED.lock_in_period_months, rent_escalation_percentage = EXCLUDED.rent_escalation_percentage, maintenance_charges = EXCLUDED.maintenance_charges, deposit_months = EXCLUDED.deposit_months, permitted_uses = EXCLUDED.permitted_uses, restrictions = EXCLUDED.restrictions\`,
      [
        id, cld.lockInPeriodMonths ?? null, cld.rentEscalationPercentage ?? null, cld.maintenanceCharges ?? null, cld.depositMonths ?? null, cld.permittedUses ?? null, cld.restrictions ?? null,
      ]
    );
  }

  if (input.hallDetails) {
    const hd = input.hallDetails as any;
    await query(
      \`INSERT INTO property_hall_details (
        property_id, seating_capacity, floating_capacity, dining_capacity, per_plate_cost_veg, per_plate_cost_non_veg, decoration_allowed, outside_catering_allowed, liquor_allowed, parking_capacity, ac_available, rooms_available, event_types
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (property_id) DO UPDATE SET
        seating_capacity = EXCLUDED.seating_capacity, floating_capacity = EXCLUDED.floating_capacity, dining_capacity = EXCLUDED.dining_capacity, per_plate_cost_veg = EXCLUDED.per_plate_cost_veg, per_plate_cost_non_veg = EXCLUDED.per_plate_cost_non_veg, decoration_allowed = EXCLUDED.decoration_allowed, outside_catering_allowed = EXCLUDED.outside_catering_allowed, liquor_allowed = EXCLUDED.liquor_allowed, parking_capacity = EXCLUDED.parking_capacity, ac_available = EXCLUDED.ac_available, rooms_available = EXCLUDED.rooms_available, event_types = EXCLUDED.event_types\`,
      [
        id, hd.seatingCapacity ?? null, hd.floatingCapacity ?? null, hd.diningCapacity ?? null, hd.perPlateCostVeg ?? null, hd.perPlateCostNonVeg ?? null, hd.decorationAllowed ?? true, hd.outsideCateringAllowed ?? false, hd.liquorAllowed ?? false, hd.parkingCapacity ?? null, hd.acAvailable ?? false, hd.roomsAvailable ?? null, hd.eventTypes ?? null,
      ]
    );
  }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated property.service.ts');
} else {
  console.log('Target string not found!');
}
