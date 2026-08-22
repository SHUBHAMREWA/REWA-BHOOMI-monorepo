'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Paper, Typography, Button, Grid, TextField, MenuItem, Select, FormControl,
  InputLabel, Chip, CircularProgress, Stepper, Step, StepLabel, Checkbox, FormControlLabel,
  Switch, Divider, Alert, Card, CardMedia, CardContent, IconButton, Autocomplete
} from '@mui/material';
import SellIcon from '@mui/icons-material/Sell';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import HotelIcon from '@mui/icons-material/Hotel';
import StoreIcon from '@mui/icons-material/Store';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import LandscapeIcon from '@mui/icons-material/Landscape';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '@/features/auth/AuthContext';

import { ListingPurpose, PropertyCategoryType, PropertyTypeEnum, AreaUnit } from '@rewa-bhoomi/types';
import { LISTING_PURPOSES, PROPERTY_CATEGORIES, AREA_UNITS, getFilteredPropertyTypes } from '@/config/propertyFormConfig';
import { apiGet, apiPost, apiClient } from '@/lib/api';
import LocationMapPicker from './LocationMapPicker';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';

const STEPS = [
  'Property Details',
  'Location & Media'
];

export default function PropertyPostingWizard({ propertyId }: { propertyId?: string }) {
  const router = useRouter();

  // Step state (0-indexed: 0 to 10)
  const [activeStep, setActiveStep] = useState(0);

  // Core Form State
  const [purpose, setPurpose] = useState<ListingPurpose | null>(null);
  const [category, setCategory] = useState<PropertyCategoryType | null>(null);
  const [propertyType, setPropertyType] = useState<PropertyTypeEnum | null>(null);
  const [progressLevel, setProgressLevel] = useState(0);

  // Location
  const [location, setLocation] = useState({
    address: '',
    locality: '',
    city: 'Rewa',
    district: 'Rewa',
    state: 'Madhya Pradesh',
    country: 'India',
    pincode: '486001',
    latitude: 24.5362,
    longitude: 81.3037,
    googleMapsLink: '',
  });

  // Basic Info & Pricing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceAmount, setPriceAmount] = useState<number | ''>('');
  const [priceType, setPriceType] = useState<string>('TOTAL_PRICE');
  const [billingPeriod, setBillingPeriod] = useState<string>('MONTHLY');
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [pricePerSqFt, setPricePerSqFt] = useState<number | ''>('');

  // Helper to handle number input clearing without sticky 0
  const toNumVal = (val: string) => (val === '' ? '' : Number(val));

  // Residential Details
  const [resDetails, setResDetails] = useState({
    bedrooms: '' as any,
    bathrooms: '' as any,
    balconies: '' as any,
    builtUpArea: '' as any,
    carpetArea: '' as any,
    plotArea: '' as any,
    propertyAge: '' as any,
    floor: '' as any,
    totalFloors: '' as any,
    furnishedStatus: 'SEMI_FURNISHED',
    parking: '' as any,
    facing: 'EAST',
    waterSupply: 'Corporation & Borewell',
    possessionStatus: 'Ready to Move',
    roadWidth: '' as any,
  });

  // Commercial Details
  const [commDetails, setCommDetails] = useState({
    carpetArea: '' as any,
    builtUpArea: '' as any,
    frontage: '' as any,
    depth: '' as any,
    floor: '' as any,
    totalFloors: '' as any,
    washrooms: '' as any,
    parking: '' as any,
    lift: true,
    powerBackup: true,
    airConditioning: false,
    mainRoadFacing: true,
    cornerProperty: false,
    roadWidth: '' as any,
  });

  // Land Details
  const [landDetails, setLandDetails] = useState({
    totalLandArea: '' as any,
    areaUnit: 'SQ_FT' as AreaUnit,
    landType: 'Agricultural',
    irrigationAvailable: true,
    waterSource: 'Canal & Tube Well',
    borewell: true,
    tubeWell: true,
    canal: true,
    riverAccess: false,
    electricityConnection: true,
    roadAccess: true,
    soilType: 'Black Cotton Soil',
    currentCrop: 'Wheat & Rice',
    fencing: true,
    farmHouse: false,
    nearestRoadDistance: '100 Meters',
    nearestVillage: 'Kripalpur',
    nearestCity: 'Rewa',
  });

  // PG Details
  const [pgDetails, setPgDetails] = useState({
    pgName: 'Shree Krishna PG',
    roomType: 'DOUBLE_SHARING',
    occupancy: 'Double',
    genderPreference: 'ANY',
    availableFrom: '',
    monthlyRent: 6000,
    securityDeposit: 6000,
    foodCharges: 2500,
    electricityCharges: 500,
    maintenanceCharges: 0,
    foodAvailable: true,
    mealPlan: 'ALL_MEALS',
    smokingAllowed: false,
    alcoholAllowed: false,
    visitorsAllowed: true,
    petsAllowed: false,
    curfewTime: '10:00 PM',
    minimumStayMonths: 3,
    noticePeriodDays: 30,
  });

  // Lease / Commercial Lease Details
  const [leaseDetails, setLeaseDetails] = useState({
    leaseAmount: 50000,
    leasePaymentType: 'MONTHLY',
    securityDeposit: 200000,
    leaseDurationYears: 3,
    lockInPeriodMonths: 12,
    noticePeriodDays: 60,
    availableFrom: '',
    maintenanceCost: 3000,
    camCost: 2000,
    electricityCost: 0,
    waterCost: 0,
    parkingSpaces: 4,
    rentEscalationPercentage: 5,
    escalationPeriodMonths: 12,
    allowedBusinessTypes: ['Retail', 'Office', 'Clinic', 'Bank'],
    fireSafetyCertified: true,
    powerLoadKw: 15,
    loadingUnloadingFacility: true,
  });

  // Hall Details
  const [hallDetails, setHallDetails] = useState({
    hallType: 'Banquet Hall',
    capacityPeople: 500,
    seatingCapacity: 350,
    hallAreaSqFt: 5000,
    parkingCapacityVehicles: 50,
    acAvailable: true,
    kitchenAvailable: true,
    stageAvailable: true,
    diningAreaAvailable: true,
    washroomsCount: 6,
    soundSystemAvailable: true,
    generatorBackupAvailable: true,
    cateringAvailable: true,
    pricingType: 'PER_DAY',
    priceRate: 45000,
    securityDeposit: 10000,
  });

  // Amenities
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Media
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageStorageKeys, setImageStorageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const indianStates = State.getStatesOfCountry('IN');
  const selectedStateObj = indianStates.find(s => s.name === location.state);
  const citiesOfState = selectedStateObj 
    ? City.getCitiesOfState('IN', selectedStateObj.isoCode).map(c => c.name)
    : [];

  const { user, isLoading: isAuthLoading } = useAuth();
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(!!propertyId);

  useEffect(() => {
    if (propertyId && !isAuthLoading) {
      apiClient.get(`/properties/${propertyId}`)
        .then(res => {
          const prop = res.data.data;
          setEditingPropertyId(prop.id);
          setPurpose(prop.listing_purpose);
          setCategory(prop.category_type);
          setPropertyType(prop.property_type);
          setProgressLevel(3);
          
          if (prop.location) {
            setLocation(prev => ({ ...prev, ...prop.location }));
          }
          setTitle(prop.title || '');
          setDescription(prop.description || '');
          setPriceAmount(prop.price_amount || prop.price || '');
          if (prop.price_type) setPriceType(prop.price_type);
          if (prop.billing_period) setBillingPeriod(prop.billing_period);
          setIsPriceNegotiable(prop.is_price_negotiable || false);
          setPricePerSqFt(prop.price_per_sqft || '');

          if (prop.residentialDetails) {
            setResDetails({
              bedrooms: prop.residentialDetails.bedrooms || '',
              bathrooms: prop.residentialDetails.bathrooms || '',
              balconies: prop.residentialDetails.balconies || '',
              builtUpArea: prop.residentialDetails.built_up_area || '',
              carpetArea: prop.residentialDetails.carpet_area || '',
              plotArea: prop.residentialDetails.plot_area || '',
              propertyAge: prop.residentialDetails.property_age || '',
              floor: prop.residentialDetails.floor || '',
              totalFloors: prop.residentialDetails.total_floors || '',
              furnishedStatus: prop.residentialDetails.furnished_status || 'SEMI_FURNISHED',
              parking: prop.residentialDetails.parking || '',
              facing: prop.residentialDetails.facing || 'EAST',
              waterSupply: prop.residentialDetails.water_supply || 'Corporation & Borewell',
              possessionStatus: prop.residentialDetails.possession_status || 'Ready to Move',
              roadWidth: prop.residentialDetails.road_width || '',
            });
          }
          if (prop.commercialDetails) {
            setCommDetails({
              carpetArea: prop.commercialDetails.carpet_area || '',
              builtUpArea: prop.commercialDetails.built_up_area || '',
              frontage: prop.commercialDetails.frontage || '',
              depth: prop.commercialDetails.depth || '',
              floor: prop.commercialDetails.floor || '',
              totalFloors: prop.commercialDetails.total_floors || '',
              washrooms: prop.commercialDetails.washrooms || '',
              parking: prop.commercialDetails.parking || '',
              lift: prop.commercialDetails.lift ?? true,
              powerBackup: prop.commercialDetails.power_backup ?? true,
              airConditioning: prop.commercialDetails.air_conditioning ?? false,
              mainRoadFacing: prop.commercialDetails.main_road_facing ?? true,
              cornerProperty: prop.commercialDetails.corner_property ?? false,
              roadWidth: prop.commercialDetails.road_width || '',
            });
          }
          if (prop.landDetails) {
            setLandDetails({
              totalLandArea: prop.landDetails.total_land_area || '',
              areaUnit: prop.landDetails.area_unit || 'SQ_FT',
              landType: prop.landDetails.land_type || 'Agricultural',
              irrigationAvailable: prop.landDetails.irrigation_available ?? true,
              waterSource: prop.landDetails.water_source || 'Canal & Tube Well',
              borewell: prop.landDetails.borewell ?? true,
              tubeWell: prop.landDetails.tube_well ?? true,
              canal: prop.landDetails.canal ?? true,
              riverAccess: prop.landDetails.river_access ?? false,
              electricityConnection: prop.landDetails.electricity_connection ?? true,
              roadAccess: prop.landDetails.road_access ?? true,
              soilType: prop.landDetails.soil_type || 'Black Cotton Soil',
              currentCrop: prop.landDetails.current_crop || 'Wheat & Rice',
              fencing: prop.landDetails.fencing ?? true,
              farmHouse: prop.landDetails.farm_house ?? false,
              nearestRoadDistance: prop.landDetails.nearest_road_distance || '100 Meters',
              nearestVillage: prop.landDetails.nearest_village || 'Kripalpur',
              nearestCity: prop.landDetails.nearest_city || 'Rewa',
            });
          }
          if (prop.pgDetails) {
            setPgDetails({
              pgName: prop.pgDetails.pg_name || 'Shree Krishna PG',
              roomType: prop.pgDetails.room_type || 'DOUBLE_SHARING',
              occupancy: prop.pgDetails.occupancy || 'Double',
              genderPreference: prop.pgDetails.gender_preference || 'ANY',
              availableFrom: prop.pgDetails.available_from || '',
              monthlyRent: prop.pgDetails.monthly_rent || 6000,
              securityDeposit: prop.pgDetails.security_deposit || 6000,
              foodCharges: prop.pgDetails.food_charges || 2500,
              electricityCharges: prop.pgDetails.electricity_charges || 500,
              maintenanceCharges: prop.pgDetails.maintenance_charges || 0,
              foodAvailable: prop.pgDetails.food_available ?? true,
              mealPlan: prop.pgDetails.meal_plan || 'ALL_MEALS',
              smokingAllowed: prop.pgDetails.smoking_allowed ?? false,
              alcoholAllowed: prop.pgDetails.alcohol_allowed ?? false,
              visitorsAllowed: prop.pgDetails.visitors_allowed ?? true,
              petsAllowed: prop.pgDetails.pets_allowed ?? false,
              curfewTime: prop.pgDetails.curfew_time || '10:00 PM',
              minimumStayMonths: prop.pgDetails.minimum_stay_months || 3,
              noticePeriodDays: prop.pgDetails.notice_period_days || 30,
            });
          }
          const leaseData = prop.leaseDetails || prop.commercialLeaseDetails;
          if (leaseData) {
            setLeaseDetails({
              leaseAmount: leaseData.lease_amount || 50000,
              leasePaymentType: leaseData.lease_payment_type || 'MONTHLY',
              securityDeposit: leaseData.security_deposit || 200000,
              leaseDurationYears: leaseData.lease_duration_years || 3,
              lockInPeriodMonths: leaseData.lock_in_period_months || 12,
              noticePeriodDays: leaseData.notice_period_days || 60,
              availableFrom: leaseData.available_from || '',
              maintenanceCost: leaseData.maintenance_cost || 3000,
              camCost: leaseData.cam_cost || 2000,
              electricityCost: leaseData.electricity_cost || 0,
              waterCost: leaseData.water_cost || 0,
              parkingSpaces: leaseData.parking_spaces || 4,
              rentEscalationPercentage: leaseData.rent_escalation_percentage || 5,
              escalationPeriodMonths: leaseData.escalation_period_months || 12,
              allowedBusinessTypes: leaseData.allowed_business_types || ['Retail', 'Office', 'Clinic', 'Bank'],
              fireSafetyCertified: leaseData.fire_safety_certified ?? true,
              powerLoadKw: leaseData.power_load_kw || 15,
              loadingUnloadingFacility: leaseData.loading_unloading_facility ?? true,
            });
          }
          if (prop.hallDetails) {
            setHallDetails({
              hallType: prop.hallDetails.hall_type || 'Banquet Hall',
              capacityPeople: prop.hallDetails.capacity_people || 500,
              seatingCapacity: prop.hallDetails.seating_capacity || 350,
              hallAreaSqFt: prop.hallDetails.hall_area_sq_ft || 5000,
              parkingCapacityVehicles: prop.hallDetails.parking_capacity_vehicles || 50,
              acAvailable: prop.hallDetails.ac_available ?? true,
              kitchenAvailable: prop.hallDetails.kitchen_available ?? true,
              stageAvailable: prop.hallDetails.stage_available ?? true,
              diningAreaAvailable: prop.hallDetails.dining_area_available ?? true,
              washroomsCount: prop.hallDetails.washrooms_count || 6,
              soundSystemAvailable: prop.hallDetails.sound_system_available ?? true,
              generatorBackupAvailable: prop.hallDetails.generator_backup_available ?? true,
              cateringAvailable: prop.hallDetails.catering_available ?? true,
              pricingType: prop.hallDetails.pricing_type || 'PER_DAY',
              priceRate: prop.hallDetails.price_rate || 45000,
              securityDeposit: prop.hallDetails.security_deposit || 10000,
            });
          }

          if (prop.images) {
            setImageUrls(prop.images.map((i: any) => i.url));
            setImageStorageKeys(prop.images.map((i: any) => i.storage_key).filter(Boolean));
          }
          if (prop.amenities) {
            setSelectedAmenityIds(prop.amenities.map((a: any) => a.id));
          }
        })
        .catch(() => toast.error('Failed to load property for editing'))
        .finally(() => setIsLoadingProperty(false));
    }
  }, [propertyId, isAuthLoading]);

  useEffect(() => {
    apiGet<any[]>('/properties/amenities')
      .then(res => setAvailableAmenities(res || []))
      .catch(() => {});
  }, []);

  // Filter property types whenever purpose or category changes
  const filteredTypes = getFilteredPropertyTypes((purpose as ListingPurpose) || "SALE", (category as PropertyCategoryType) || "RESIDENTIAL");

  useEffect(() => {
    if (filteredTypes.length > 0) {
      // Ensure propertyType is valid for purpose & category
      if (!filteredTypes.some(t => t.key === propertyType)) {
        setPropertyType(filteredTypes[0].key);
      }
    }
  }, [purpose, category]);

  // Set default pricing type based on purpose
  useEffect(() => {
    if (purpose === 'SALE') setPriceType('TOTAL_PRICE');
    else if (purpose === 'RENT') setPriceType('RENT');
    else if (purpose === 'LEASE') setPriceType('LEASE_RENT');
    else if (purpose === 'PG') setPriceType('PG_RENT');
    else if (purpose === 'COMMERCIAL_LEASE') setPriceType('COMMERCIAL_LEASE_RENT');
  }, [purpose]);

  const handlePurposeSelect = (pKey: ListingPurpose) => {
      setPurpose(pKey);
      const purposeOpt = LISTING_PURPOSES.find(p => p.key === pKey);
      if (purposeOpt && category && !purposeOpt.allowedCategories.includes(category)) {
        setCategory(null);
        setPropertyType(null);
      }
      setProgressLevel(1);
    };

  const handleCategorySelect = (cKey: PropertyCategoryType) => {
      setCategory(cKey);
      setPropertyType(null);
      setProgressLevel(2);
    };

  const handlePropertyTypeSelect = (tKey: PropertyTypeEnum) => {
      setPropertyType(tKey);
      setProgressLevel(3);
    };

  // Media Upload Handler (WebP converted & uploaded to R2)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post<{ success: true; data: { url: string; key?: string; storage_key?: string } }>(
          '/media/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        const uploadedUrl = res.data?.data?.url;
        const uploadedKey = res.data?.data?.storage_key || res.data?.data?.key || uploadedUrl;

        if (uploadedUrl) {
          setImageUrls(prev => [...prev, uploadedUrl]);
          if (uploadedKey) {
            setImageStorageKeys(prev => [...prev, String(uploadedKey)]);
          }
        }
      }
      toast.success('Images uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageStorageKeys(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to remove empty strings and undefined keys from detail objects
  const cleanDetailObj = (obj: any) => {
    if (!obj) return undefined;
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== '' && obj[key] !== undefined && obj[key] !== null) {
        cleaned[key] = obj[key];
      }
    });
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };

  // Submit Handler
  const handleSubmitProperty = async () => {
    setSubmitting(true);
    try {
      const rawTitle = title.trim();
      const finalTitle = rawTitle.length >= 5 ? rawTitle : `${(propertyType || "").replace('_', ' ')} for ${purpose} in ${location.city}`;
      
      const rawDesc = description.trim();
      const finalDesc = rawDesc.length >= 10 
        ? rawDesc 
        : `${finalTitle}. Premium property located in ${location.locality || location.city}, ${location.state}. Contact for details.`;

      const numPrice = Number(priceAmount);
      const fallbackPrice = Number(pgDetails.monthlyRent) || Number(leaseDetails.leaseAmount) || Number(hallDetails.priceRate) || 10000;
      const finalPrice = (numPrice && numPrice > 0) ? numPrice : fallbackPrice;

      // Filter amenityIds to valid UUIDs only (36 chars)
      const validAmenityIds = selectedAmenityIds.filter(id => typeof id === 'string' && id.length === 36);

      const payload = {
        title: finalTitle,
        description: finalDesc,
        listingPurpose: purpose,
        categoryType: category,
        propertyType,
        priceAmount: finalPrice,
        priceType,
        billingPeriod,
        isPriceNegotiable,
        pricePerSqFt: (pricePerSqFt && Number(pricePerSqFt) > 0) ? Number(pricePerSqFt) : undefined,
        location: {
          address: location.address || undefined,
          locality: location.locality || undefined,
          city: location.city || 'Rewa',
          district: location.district || 'Rewa',
          state: location.state || 'Madhya Pradesh',
          country: location.country || 'India',
          pincode: (location.pincode && /^\d{6}$/.test(location.pincode)) ? location.pincode : undefined,
          latitude: location.latitude,
          longitude: location.longitude,
          googleMapsLink: location.googleMapsLink || undefined,
        },
        amenityIds: validAmenityIds,
        imageUrls: imageUrls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0),
        imageStorageKeys: imageStorageKeys.filter((k): k is string => typeof k === 'string' && k.trim().length > 0),
        residentialDetails: category === 'RESIDENTIAL' ? cleanDetailObj(resDetails) : undefined,
        commercialDetails: category === 'COMMERCIAL' ? cleanDetailObj(commDetails) : undefined,
        landDetails: category === 'LAND' ? cleanDetailObj(landDetails) : undefined,
        pgDetails: purpose === 'PG' ? cleanDetailObj(pgDetails) : undefined,
        leaseDetails: (purpose === 'LEASE' || purpose === 'COMMERCIAL_LEASE') ? cleanDetailObj(leaseDetails) : undefined,
        commercialLeaseDetails: purpose === 'COMMERCIAL_LEASE' ? cleanDetailObj(leaseDetails) : undefined,
        hallDetails: category === 'SPECIAL' ? cleanDetailObj(hallDetails) : undefined,
      };

      if (editingPropertyId) {
        await apiClient.patch(`/properties/${editingPropertyId}`, payload);
        toast.success('Property updated successfully!');
      } else {
        await apiPost('/properties', payload);
        toast.success('Property posted successfully!');
      }
      setActiveStep(10); // Move to Publish screen
    } catch (err: any) {
      console.error('Property submit error:', err.response?.data);
      const fieldErrors = err.response?.data?.error?.details?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const errorMsgs = Object.entries(fieldErrors)
          .map(([field, msgs]: any) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        toast.error(`Validation Failed: ${errorMsgs}`);
      } else {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to post property');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const PurposeIcon = ({ name }: { name: string }) => {
    if (name === 'Sell') return <SellIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#2563EB' }} />;
    if (name === 'Key') return <KeyIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#16A34A' }} />;
    if (name === 'Description') return <DescriptionIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#D97706' }} />;
    if (name === 'Hotel') return <HotelIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#9333EA' }} />;
    return <StoreIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#0284C7' }} />;
  };

  const CategoryIcon = ({ name }: { name: string }) => {
    if (name === 'Home') return <HomeIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#2563EB' }} />;
    if (name === 'Business') return <BusinessIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#D97706' }} />;
    if (name === 'Landscape') return <LandscapeIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#16A34A' }} />;
    return <MeetingRoomIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#9333EA' }} />;
  };

  if (isLoadingProperty) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  
  const handleStepClick = (idx: number) => {
    if (activeStep === 2) return; // Disallow going back from success page
    if (idx === 0) setActiveStep(0);
    if (idx === 1 && title.length >= 10 && description.length >= 10 && progressLevel >= 3) {
      setActiveStep(1);
    }
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        {/* Header Title */}
        <Box mb={{ xs: 2, sm: 4 }} textAlign="center">
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Apni Property Post Karein
          </Typography>
          <Typography variant="body1" color="#64748B" mt={0.5} sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            Rewa ke #1 Real Estate Marketplace par asani se apni property list karein
          </Typography>
        </Box>

        {/* Stepper Header */}
        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2.5, sm: 4 }, border: '1px solid #E2E8F0', bgcolor: '#fff',  }}>
          <Box sx={{ width: '100%', px: { xs: 1, sm: 0 } }}>
            <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={activeStep > idx}>
                <StepLabel 
                  onClick={() => handleStepClick(idx)} 
                  sx={{ 
                    cursor: (activeStep === 2) ? 'default' : ((idx === 0) || (idx === 1 && title.length >= 10 && description.length >= 10 && progressLevel >= 3)) ? 'pointer' : 'default',
                    '& .MuiStepLabel-label': { fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: { xs: 0.5, sm: 1 } }, 
                    '& .MuiStepIcon-root': { width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 } } 
                  }}
                >{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          </Box>
        </Paper>

        {/* ─── STEP 0: LISTING PURPOSE ─── */}
        {((activeStep === 0)) && (
          <Box>
            {progressLevel > 0 && purpose ? (
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1}>Listing Purpose</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#0F172A" display="flex" alignItems="center" gap={0.75}><CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.25rem' }} /> {LISTING_PURPOSES.find(p => p.key === purpose)?.title}</Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => setProgressLevel(0)} sx={{ textTransform: 'none', borderRadius: 2 }}>Change</Button>
              </Paper>
            ) : (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={700} textAlign="center" mb={1} sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Aap Kya Karna Chahte Hain?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Apni requirement ke hisab se niche diya gaya option select karein
            </Typography>

            <Grid container spacing={3}>
              {LISTING_PURPOSES.map((item) => {
                const isSelected = purpose === item.key;
                return (
                  <Grid item xs={12} sm={6} md={4} key={item.key}>
                    <Paper
                      elevation={0}
                      onClick={() => handlePurposeSelect(item.key)}
                      sx={{
                        p: { xs: 1.25, sm: 2.5 },
                        borderRadius: { xs: 2, sm: 3 },
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <PurposeIcon name={item.iconName} />
                        <Typography variant="h6" fontWeight={700} color="#0F172A" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="#64748B" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.subtitle}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          
              </Box>
            )}
          </Box>
        )}

        {/* ─── STEP 1: PROPERTY CATEGORY ─── */}
        {((activeStep === 0)) && progressLevel >= 1 && purpose !== null && (
          <Box>
            {progressLevel > 1 && category ? (
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1}>Property Category</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#0F172A" display="flex" alignItems="center" gap={0.75}><CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.25rem' }} /> {PROPERTY_CATEGORIES.find(c => c.key === category)?.title}</Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => setProgressLevel(1)} sx={{ textTransform: 'none', borderRadius: 2 }}>Change</Button>
              </Paper>
            ) : (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={700} textAlign="center" mb={1} sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Aapki Property Kis Category Me Aati Hai?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Purpose selected: <strong>{purpose}</strong> — Apni property ki category select karein
            </Typography>

            <Grid container spacing={3}>
              {PROPERTY_CATEGORIES.filter(cat => {
                const purpOpt = LISTING_PURPOSES.find(p => p.key === purpose);
                return purpOpt ? purpOpt.allowedCategories.includes(cat.key) : true;
              }).map((item) => {
                const isSelected = category === item.key;
                return (
                  <Grid item xs={6} sm={6} md={3} key={item.key}>
                    <Paper
                      elevation={0}
                      onClick={() => handleCategorySelect(item.key)}
                      sx={{
                        p: { xs: 1.25, sm: 2.5 },
                        borderRadius: { xs: 2, sm: 3 },
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        transition: 'all 0.2s ease-in-out',
                        textAlign: 'center',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
                      }}
                    >
                      <Box mb={1} display="flex" justifyContent="center">
                        <CategoryIcon name={item.iconName} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="#0F172A" mb={0.5} sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="#64748B" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}>
                        {item.subtitle}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          
              </Box>
            )}
          </Box>
        )}

        {/* ─── STEP 2: PROPERTY TYPE ─── */}
        {((activeStep === 0)) && progressLevel >= 2 && category !== null && (
          <Box>
            {progressLevel > 2 && propertyType ? (
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 4, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1}>Property Type</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#0F172A" display="flex" alignItems="center" gap={0.75}><CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.25rem' }} /> {filteredTypes.find(p => p.key === propertyType!)?.label}</Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => setProgressLevel(2)} sx={{ textTransform: 'none', borderRadius: 2 }}>Change</Button>
              </Paper>
            ) : (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={700} textAlign="center" mb={1} sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Property Ka Type Select Karein
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3} sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              Category: <strong>{category}</strong> | Purpose: <strong>{purpose}</strong> — Sahi type par click karein
            </Typography>

            <Grid container spacing={2}>
              {filteredTypes.map((item) => {
                const isSelected = propertyType! === item.key;
                return (
                  <Grid item xs={6} sm={6} md={4} key={item.key}>
                    <Paper
                      elevation={0}
                      onClick={() => handlePropertyTypeSelect(item.key)}
                      sx={{
                        p: { xs: 1.25, sm: 2 },
                        borderRadius: { xs: 2, sm: 3 },
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        '&:hover': { borderColor: '#2563EB' },
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700} color="#0F172A" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {item.label}
                      </Typography>
                      {isSelected && <CheckCircleIcon color="primary" fontSize="small" sx={{ ml: 'auto' }} />}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          
              </Box>
            )}
          </Box>
        )}

        {/* ─── STEP 3: LOCATION ─── */}
        {((activeStep === 1)) && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Location Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="City"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="State"
                  value={location.state}
                  onChange={(e) => setLocation({ ...location, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Locality / Sector / Area"
                  value={location.locality}
                  onChange={(e) => setLocation({ ...location, locality: e.target.value })}
                  placeholder="e.g. Civil Lines, Kripalpur"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Pincode"
                  value={location.pincode}
                  onChange={(e) => setLocation({ ...location, pincode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" multiline rows={2} label="Full Address"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Google Maps Link (Optional)"
                  value={location.googleMapsLink}
                  onChange={(e) => setLocation({ ...location, googleMapsLink: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </Grid>
            </Grid>

            {/* Dynamic Interactive Location Map Picker */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={indianStates.map(s => s.name)}
                  value={location.state}
                  onChange={(e: any, newValue: string | null) => setLocation({ ...location, state: newValue || '', city: '', locality: '' })}
                  renderInput={(params) => <TextField {...params} label="State" required size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={citiesOfState}
                  value={location.city}
                  onChange={(e: any, newValue: string | null) => setLocation({ ...location, city: newValue || '', locality: '' })}
                  renderInput={(params) => <TextField {...params} label="City" required size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth size="small" label="Locality" required
                  value={location.locality}
                  onChange={(e) => setLocation({ ...location, locality: e.target.value })}
                  placeholder="e.g. Civil Lines"
                />
              </Grid>
            </Grid>\n            <LocationMapPicker
              initialLat={location.latitude}
              initialLng={location.longitude}
              city={location.city}
              state={location.state}
              onLocationSelect={(loc) => setLocation({ ...location, latitude: loc.lat, longitude: loc.lng, address: loc.address || location.address })}
            />
          </Paper>
        )}

        {/* ─── STEP 4: PROPERTY SPECIFIC DETAILS ─── */}
        {((activeStep === 0)) && progressLevel >= 3 && propertyType !== null && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Property Attributes ({(propertyType || "").replace('_', ' ')})
            </Typography>

            {/* Residential House/Apartment/Villa Fields */}
            {category === 'RESIDENTIAL' && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" type="number" label="Bedrooms (BHK)" value={resDetails.bedrooms} onChange={(e) => setResDetails({ ...resDetails, bedrooms: toNumVal(e.target.value) })} placeholder="e.g. 2" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" type="number" label="Bathrooms" value={resDetails.bathrooms} onChange={(e) => setResDetails({ ...resDetails, bathrooms: toNumVal(e.target.value) })} placeholder="e.g. 2" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" type="number" label="Balconies" value={resDetails.balconies} onChange={(e) => setResDetails({ ...resDetails, balconies: toNumVal(e.target.value) })} placeholder="e.g. 1" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="number" label="Carpet Area (Sq Ft)" value={resDetails.carpetArea} onChange={(e) => setResDetails({ ...resDetails, carpetArea: toNumVal(e.target.value) })} placeholder="e.g. 1000" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="number" label="Built-up Area (Sq Ft)" value={resDetails.builtUpArea} onChange={(e) => setResDetails({ ...resDetails, builtUpArea: toNumVal(e.target.value) })} placeholder="e.g. 1200" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Furnished Status</InputLabel>
                    <Select label="Furnished Status" value={resDetails.furnishedStatus} onChange={(e) => setResDetails({ ...resDetails, furnishedStatus: e.target.value })}>
                      <MenuItem value="UNFURNISHED">Unfurnished</MenuItem>
                      <MenuItem value="SEMI_FURNISHED">Semi-Furnished</MenuItem>
                      <MenuItem value="FULLY_FURNISHED">Fully Furnished</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Facing Direction" value={resDetails.facing} onChange={(e) => setResDetails({ ...resDetails, facing: e.target.value })} placeholder="East, North-East, West..." />
                </Grid>
              </Grid>
            )}

            {/* Land & Agricultural Fields */}
            {category === 'LAND' && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="number" label="Total Land Area" value={landDetails.totalLandArea} onChange={(e) => setLandDetails({ ...landDetails, totalLandArea: toNumVal(e.target.value) })} placeholder="e.g. 1200" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Area Unit</InputLabel>
                    <Select label="Area Unit" value={landDetails.areaUnit} onChange={(e) => setLandDetails({ ...landDetails, areaUnit: e.target.value as AreaUnit })}>
                      {AREA_UNITS.map(u => <MenuItem key={u.key} value={u.key}>{u.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Soil Type" value={landDetails.soilType} onChange={(e) => setLandDetails({ ...landDetails, soilType: e.target.value })} placeholder="Black Cotton, Alluvial, Red Soil" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Current Crop" value={landDetails.currentCrop} onChange={(e) => setLandDetails({ ...landDetails, currentCrop: e.target.value })} placeholder="Wheat, Rice, Pulses" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={landDetails.irrigationAvailable} onChange={(e) => setLandDetails({ ...landDetails, irrigationAvailable: e.target.checked })} />} label="Pani ki vyawastha hai? (Sinchai / Water Facility)" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={landDetails.borewell} onChange={(e) => setLandDetails({ ...landDetails, borewell: e.target.checked })} />} label="Borewell ya Nal / Tube well ki suvidha hai?" />
                </Grid>
              </Grid>
            )}

            {/* PG Specific Fields */}
            {purpose === 'PG' && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="PG / Hostel Name" value={pgDetails.pgName} onChange={(e) => setPgDetails({ ...pgDetails, pgName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Room Type</InputLabel>
                    <Select label="Room Type" value={pgDetails.roomType} onChange={(e) => setPgDetails({ ...pgDetails, roomType: e.target.value })}>
                      <MenuItem value="SINGLE">Single Room</MenuItem>
                      <MenuItem value="DOUBLE_SHARING">Double Sharing</MenuItem>
                      <MenuItem value="TRIPLE_SHARING">Triple Sharing</MenuItem>
                      <MenuItem value="FOUR_SHARING">Four Sharing</MenuItem>
                      <MenuItem value="DORMITORY">Dormitory</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender Preference</InputLabel>
                    <Select label="Gender Preference" value={pgDetails.genderPreference} onChange={(e) => setPgDetails({ ...pgDetails, genderPreference: e.target.value })}>
                      <MenuItem value="MALE">Male Only</MenuItem>
                      <MenuItem value="FEMALE">Female Only</MenuItem>
                      <MenuItem value="ANY">Any / Unisex</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={pgDetails.foodAvailable} onChange={(e) => setPgDetails({ ...pgDetails, foodAvailable: e.target.checked })} />} label="Food / Meals Available?" />
                </Grid>
              </Grid>
            )}
          </Paper>
        )}

        {/* ─── STEP 5: PRICING / FINANCIALS ─── */}
        {((activeStep === 0)) && progressLevel >= 3 && propertyType !== null && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Financial & Pricing Details
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" type="number"
                  label={purpose === 'SALE' ? 'Expected Sale Price (₹)' : purpose === 'PG' ? 'Monthly PG Rent (₹)' : 'Rent / Lease Amount (₹)'}
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(toNumVal(e.target.value))}
                  placeholder="e.g. 2500000"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={isPriceNegotiable} onChange={(e) => setIsPriceNegotiable(e.target.checked)} />}
                  label="Price Negotiable?"
                  sx={{ mt: 1 }}
                />
              </Grid>

              {(purpose === 'RENT' || purpose === 'LEASE' || purpose === 'COMMERCIAL_LEASE' || purpose === 'PG') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" type="number" label="Security Deposit (₹)"
                    value={leaseDetails.securityDeposit}
                    onChange={(e) => setLeaseDetails({ ...leaseDetails, securityDeposit: toNumVal(e.target.value) as any })}
                    placeholder="e.g. 50000"
                  />
                </Grid>
              )}

              {purpose === 'COMMERCIAL_LEASE' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Lock-in Period (Months)" value={leaseDetails.lockInPeriodMonths} onChange={(e) => setLeaseDetails({ ...leaseDetails, lockInPeriodMonths: toNumVal(e.target.value) as any })} placeholder="e.g. 12" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Rent Escalation (%)" value={leaseDetails.rentEscalationPercentage} onChange={(e) => setLeaseDetails({ ...leaseDetails, rentEscalationPercentage: toNumVal(e.target.value) as any })} placeholder="e.g. 5" />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        )}

        {/* ─── STEP 6: AMENITIES ─── */}
        {((activeStep === 1)) && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Property Ki Suvidhayein (Amenities) Select Karein
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Aapki property me jo-jo suvidhayein uplabdh hain unhe tick karein
            </Typography>

                          <Box display="flex" flexWrap="wrap" gap={1.5}>
                {(availableAmenities.length > 0 ? availableAmenities : [
                  { id: '1', name: 'Parking' }, { id: '2', name: 'Power Backup' }, { id: '3', name: '24x7 Security' },
                  { id: '4', name: 'WiFi' }, { id: '5', name: 'Lift / Elevator' }, { id: '6', name: 'Air Conditioning' },
                  { id: '7', name: 'Water Supply' }, { id: '8', name: 'CCTV Surveillance' }, { id: '9', name: 'Garden / Park' },
                ]).map((item) => {
                  const isChecked = selectedAmenityIds.includes(item.id);
                  return (
                    <Chip
                      key={item.id}
                      label={item.name}
                      clickable
                      onClick={() => {
                        setSelectedAmenityIds(prev =>
                          prev.includes(item.id)
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      color={isChecked ? 'primary' : 'default'}
                      variant={isChecked ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.875rem', px: 1, py: 2, borderRadius: 2 }}
                    />
                  );
                })}
              </Box>
          </Paper>
        )}

        {/* ─── STEP 7: PHOTOS & MEDIA ─── */}
        {((activeStep === 1)) && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Property Ki Photos Upload Karein
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Khariddaar aur tenants ko dikhane ke liye acchi photos add karein
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #CBD5E1',
                borderRadius: 3,
                p: { xs: 3, sm: 4 },
                textAlign: 'center',
                bgcolor: '#F8FAFC',
                cursor: 'pointer',
                '&:hover': { borderColor: '#2563EB', bgcolor: '#EFF6FF' },
              }}
              component="label"
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: '#64748B', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} color="#0F172A">
                Click to upload property images
              </Typography>
              <Typography variant="caption" color="#94A3B8">
                PNG, JPG, WebP supported. Auto-compressed before R2 storage.
              </Typography>
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </Box>

            {uploading && <Box textAlign="center" my={2}><CircularProgress size={24} /><Typography variant="caption" display="block">Uploading to Cloudflare R2...</Typography></Box>}

            {imageUrls.length > 0 && (
              <Grid container spacing={2} mt={3}>
                {imageUrls.map((url, idx) => (
                  <Grid item xs={6} sm={4} md={3} key={url}>
                    <Card sx={{ position: 'relative', borderRadius: 2 }}>
                      <CardMedia component="img" height="140" image={url} alt={`Upload ${idx}`} />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(idx)}
                        sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: '#EF4444' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        )}

        {/* ─── STEP 8: DESCRIPTION ─── */}
        {((activeStep === 0)) && progressLevel >= 3 && propertyType !== null && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Title Aur Property Ka Vivaran (Description)
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Property Title" required
                  value={title}
                  inputProps={{ maxLength: 70 }}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Beautiful 3 BHK House in Civil Lines, Rewa"
                  error={title.length > 0 && title.length < 10}
                  helperText={
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <span>{title.length > 0 && title.length < 10 ? "A minimum length of 10 characters is required." : ""}</span>
                      <span>{70 - (title?.length || 0)} characters left</span>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={5} label="Detailed Description" required
                  value={description}
                  inputProps={{ maxLength: 4096 }}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe key highlights, surrounding landmarks, connectivity, road width, and special terms..."
                  error={description.length > 0 && description.length < 10}
                  helperText={
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <span>{description.length > 0 && description.length < 10 ? "A minimum length of 10 characters is required." : ""}</span>
                      <span>{4096 - (description?.length || 0)} characters left</span>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* ─── STEP 9: PREVIEW ─── */}
        {false && (
          <Box>
            <Box textAlign="center" mb={4}>
              <Typography variant="h5" fontWeight={800} color="#0F172A" mb={0.5}>
                🎯 Apni Listing Ka Preview Dekh Lo!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Publish karne se pehle sabhi details ek baar zaroor check kar lo — yahi exactly dikhega buyers ko.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              {user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN') ? (
                <strong>Note:</strong>
              ) : (
                <strong>Note:</strong>
              )}
              {user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN') 
                ? ' Aap admin hain, toh submit/update karte hi action turant apply hoga. Koi bhi galti ho toh neeche "Back" karke fix kar lo.' 
                : ' Property submit karne ke baad admin approval ke baad hi ye listing public hogi. Koi bhi galti ho toh neeche "Back" karke fix kar lo.'}
            </Alert>

            {/* Property Images Preview */}
            {imageUrls.length > 0 && (
              <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, border: '1px solid #E2E8F0' }}>
                <Box sx={{ position: 'relative', height: { xs: 200, sm: 300 }, bgcolor: '#0F172A' }}>
                  <Box
                    component="img"
                    src={imageUrls[0]}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
                  />
                  {imageUrls.length > 1 && (
                    <Chip
                      label={`+${imageUrls.length - 1} aur photos`}
                      size="small"
                      sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 600 }}
                    />
                  )}
                </Box>
                {imageUrls.length > 1 && (
                  <Box display="flex" gap={1} p={1.5} overflow="auto" sx={{ bgcolor: '#F8FAFC' }}>
                    {imageUrls.slice(1).map((url, i) => (
                      <Box key={i} component="img" src={url} sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0, border: '2px solid #E2E8F0' }} />
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {/* Main Info Card */}
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', mb: 3 }}>
              {/* Status Chips */}
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={purpose} color="primary" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={category} variant="outlined" size="small" />
                <Chip label={(propertyType || "").replace(/_/g, ' ')} variant="outlined" size="small" />
                {!(user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN')) && (
                  <Chip label="⏳ Pending Admin Approval" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
                )}
              </Box>

              {/* Title */}
              <Typography variant="h5" fontWeight={800} color="#0F172A" mb={1} sx={{ lineHeight: 1.3 }}>
                {title || `${(propertyType || "").replace(/_/g, ' ')} for ${purpose} in ${location.city}`}
              </Typography>

              {/* Location */}
              <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                <LocationOnIcon sx={{ fontSize: 18, color: '#EF4444' }} />
                <Typography variant="body2" color="#64748B">
                  {[location.locality, location.city, location.district, location.state].filter(Boolean).join(', ')}
                  {location.pincode && ` - ${location.pincode}`}
                </Typography>
              </Box>

              {/* Price */}
              <Box display="flex" alignItems="baseline" gap={1} mb={3}>
                <Typography variant="h4" fontWeight={800} color="#16A34A">
                  ₹{Number(priceAmount || 0).toLocaleString('en-IN')}
                </Typography>
                {priceType !== 'TOTAL_PRICE' && (
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    / {billingPeriod.toLowerCase()}
                  </Typography>
                )}
                {isPriceNegotiable && (
                  <Chip label="Negotiable" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600 }} />
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Key Details Grid */}
              {category === 'RESIDENTIAL' && (resDetails.bedrooms || resDetails.bathrooms || resDetails.carpetArea || resDetails.builtUpArea) && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={2}>🏠 Property Details</Typography>
                  <Grid container spacing={2}>
                    {resDetails.bedrooms && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="h6" fontWeight={800} color="#0F172A">{resDetails.bedrooms}</Typography><Typography variant="caption" color="text.secondary">Bedrooms</Typography></Box></Grid>}
                    {resDetails.bathrooms && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="h6" fontWeight={800} color="#0F172A">{resDetails.bathrooms}</Typography><Typography variant="caption" color="text.secondary">Bathrooms</Typography></Box></Grid>}
                    {resDetails.carpetArea && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="h6" fontWeight={800} color="#0F172A">{resDetails.carpetArea}</Typography><Typography variant="caption" color="text.secondary">Carpet Area (sqft)</Typography></Box></Grid>}
                    {resDetails.builtUpArea && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="h6" fontWeight={800} color="#0F172A">{resDetails.builtUpArea}</Typography><Typography variant="caption" color="text.secondary">Built-up Area (sqft)</Typography></Box></Grid>}
                    {resDetails.furnishedStatus && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Furnished</Typography><Typography variant="body2" fontWeight={700} color="#0F172A">{resDetails.furnishedStatus.replace('_', ' ')}</Typography></Box></Grid>}
                    {resDetails.facing && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Facing</Typography><Typography variant="body2" fontWeight={700} color="#0F172A">{resDetails.facing}</Typography></Box></Grid>}
                    {resDetails.possessionStatus && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Possession</Typography><Typography variant="body2" fontWeight={700} color="#0F172A">{resDetails.possessionStatus}</Typography></Box></Grid>}
                  </Grid>
                </Box>
              )}

              {category === 'LAND' && landDetails.totalLandArea && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={2}>🌾 Land Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="h6" fontWeight={800} color="#0F172A">{landDetails.totalLandArea}</Typography><Typography variant="caption" color="text.secondary">Area ({landDetails.areaUnit})</Typography></Box></Grid>
                    {landDetails.soilType && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Mitti Ka Prakar</Typography><Typography variant="body2" fontWeight={700}>{landDetails.soilType}</Typography></Box></Grid>}
                    {landDetails.currentCrop && <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Current Fasal</Typography><Typography variant="body2" fontWeight={700}>{landDetails.currentCrop}</Typography></Box></Grid>}
                    <Grid item xs={6} sm={3}><Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Irrigation</Typography><Typography variant="body2" fontWeight={700}>{landDetails.irrigationAvailable ? '✅ Available' : '❌ NA'}</Typography></Box></Grid>
                  </Grid>
                </Box>
              )}

              {purpose === 'PG' && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={2}>🏨 PG Details</Typography>
                  <Grid container spacing={2}>
                    {pgDetails.pgName && <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">PG Name</Typography><Typography variant="body2" fontWeight={700}>{pgDetails.pgName}</Typography></Grid>}
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Room Type</Typography><Typography variant="body2" fontWeight={700}>{pgDetails.roomType.replace('_', ' ')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Gender</Typography><Typography variant="body2" fontWeight={700}>{pgDetails.genderPreference}</Typography></Grid>
                    {pgDetails.securityDeposit && <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Security Deposit</Typography><Typography variant="body2" fontWeight={700}>₹{Number(pgDetails.securityDeposit).toLocaleString('en-IN')}</Typography></Grid>}
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Khana Available</Typography><Typography variant="body2" fontWeight={700}>{pgDetails.foodAvailable ? '✅ Yes' : '❌ No'}</Typography></Grid>
                  </Grid>
                </Box>
              )}

              {/* Description */}
              {description && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={1.5}>📝 Description</Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {description}
                  </Typography>
                </Box>
              )}

              {/* Amenities */}
              {selectedAmenityIds.length > 0 && availableAmenities.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={1.5}>✨ Suvidhayein (Amenities)</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {availableAmenities
                      .filter(a => selectedAmenityIds.includes(a.id))
                      .map(a => (
                        <Chip key={a.id} label={a.name} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                      ))
                    }
                  </Box>
                </Box>
              )}

              {/* Location Link */}
              {location.googleMapsLink && (
                <Box mt={2}>
                  <Chip
                    label="📍 Google Maps par dekho"
                    component="a"
                    href={location.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600 }}
                  />
                </Box>
              )}
            </Paper>

            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Ek Baar Aur Check Karo:</strong> Koi bhi jankari galat lagi toh <strong>"Back"</strong> button se wapas jao aur sudhaar lo. 
              {user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN') 
                ? ' Action turant apply ho jayega.' 
                : ' Submit karne ke baad Admin review karega.'}
            </Alert>
          </Box>
        )}

        {/* ─── STEP 10: SUBMIT SUCCESS ─── */}
        {((activeStep === 2)) && (
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 6 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: '#fff', textAlign: 'center' }}>
            <Box sx={{ fontSize: 72, mb: 2 }}>🎉</Box>
            <Typography variant="h4" fontWeight={800} color="#0F172A" mb={1}>
              {editingPropertyId ? 'Property Update Ho Gayi!' : 'Property Submit Ho Gayi!'}
            </Typography>
            <Typography variant="body1" color="#64748B" mb={1}>
              Aapki property successfully {editingPropertyId ? 'update' : 'submit'} ho gayi hai.
            </Typography>
            
            {user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN') ? (
              <Alert severity="success" sx={{ mb: 4, textAlign: 'left', borderRadius: 2 }}>
                <strong>Admin Action Successful:</strong> {editingPropertyId ? 'Property update ho gayi hai. Agar property abhi Pending/Rejected hai, toh aap dashboard se ise Approve kar sakte hain.' : 'Kyunki aap Admin hain, aapki nayi property directly live ho gayi hai!'}
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 4, textAlign: 'left', borderRadius: 2 }}>
                <strong>Admin Approval Baaki Hai:</strong> Aapki property abhi <strong>Review Queue</strong> me hai. Hamara admin team jald hi review karega. Approve hone ke baad automatically Rewa Bhoomi par live ho jaayegi. Aapko notify kiya jaayega.
              </Alert>
            )}

            <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
              <Button variant="contained" onClick={() => router.push('/properties')} sx={{ textTransform: 'none', px: 4 }}>
                Browse Properties
              </Button>
              <Button variant="outlined" onClick={() => { setActiveStep(0); }} sx={{ textTransform: 'none', px: 4 }}>
                Ek Aur Property Post Karo
              </Button>
            </Box>
          </Paper>
        )}

        {/* Navigation Control Buttons */}
        {activeStep < 2 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>

            {activeStep < 1 ? (
              <Button
                variant="contained"
                disabled={title.length < 10 || description.length < 10 || progressLevel < 3}
                onClick={() => setActiveStep(prev => prev + 1)}
                endIcon={<ArrowForwardIcon />}
                sx={{ textTransform: 'none', px: 4 }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmitProperty}
                disabled={submitting}
                sx={{ textTransform: 'none', px: 5, py: 1.2, fontWeight: 700 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Publish Listing Now'}
              </Button>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
