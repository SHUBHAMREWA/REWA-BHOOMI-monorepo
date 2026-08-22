import { ListingPurpose, PropertyCategoryType, PropertyTypeEnum, AreaUnit } from '@rewa-bhoomi/types';

export interface ListingPurposeOption {
  key: ListingPurpose;
  title: string;
  subtitle: string;
  iconName: string;
  allowedCategories: PropertyCategoryType[];
}

export interface CategoryOption {
  key: PropertyCategoryType;
  title: string;
  subtitle: string;
  iconName: string;
}

export interface PropertyTypeOption {
  key: PropertyTypeEnum;
  label: string;
  category: PropertyCategoryType;
  allowedPurposes: ListingPurpose[];
}

export const LISTING_PURPOSES: ListingPurposeOption[] = [
  {
    key: 'SALE',
    title: 'Sell',
    subtitle: 'Apni zameen, ghar, plot, shop, ya commercial property ko bechne ke liye yahan click karein',
    iconName: 'Sell',
    allowedCategories: ['RESIDENTIAL', 'COMMERCIAL', 'LAND', 'SPECIAL'],
  },
  {
    key: 'RENT',
    title: 'Rent',
    subtitle: 'Apna ghar, kamra, shop, ya commercial space kiraye (Rent) par dene ke liye select karein',
    iconName: 'Key',
    allowedCategories: ['RESIDENTIAL', 'COMMERCIAL', 'SPECIAL'],
  },
  {
    key: 'LEASE',
    title: 'Lease',
    subtitle: 'Zameen, ghar, ya building ko lambe samay (Contractual Lease) par dene ke liye select karein',
    iconName: 'Description',
    allowedCategories: ['RESIDENTIAL', 'COMMERCIAL', 'LAND', 'SPECIAL'],
  },
  {
    key: 'PG',
    title: 'PG / Paying Guest',
    subtitle: 'Students aur working professionals ke liye Single/Shared Room ya PG list karne ke liye',
    iconName: 'Hotel',
    allowedCategories: ['RESIDENTIAL'],
  },
  {
    key: 'COMMERCIAL_LEASE',
    title: 'Commercial Lease',
    subtitle: 'Shop, Office, Showroom, Godown, Warehouse ya Commercial Land ko lease par dene ke liye',
    iconName: 'Store',
    allowedCategories: ['COMMERCIAL', 'LAND'],
  },
];

export const PROPERTY_CATEGORIES: CategoryOption[] = [
  { key: 'LAND', title: 'Land & Plots', subtitle: 'Plot, Kheti ki Zameen (Farm Land) aur Land Parcels ke liye', iconName: 'Landscape' },
  { key: 'RESIDENTIAL', title: 'Residential', subtitle: 'Ghar, Flat, Villa, Kamra aur PG listings ke liye', iconName: 'Home' },
  { key: 'COMMERCIAL', title: 'Commercial', subtitle: 'Dukaan, Office, Showroom aur Warehouse ke liye', iconName: 'Business' },
  { key: 'SPECIAL', title: 'Special Purpose', subtitle: 'Marriage Hall, Banquet, Guest House aur Hotel ke liye', iconName: 'MeetingRoom' },
];

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  // Residential Types
  { key: 'HOUSE', label: 'Independent House (Makan)', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },
  { key: 'APARTMENT', label: 'Apartment / Flat', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },
  { key: 'VILLA', label: 'Villa', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },
  { key: 'FARMHOUSE', label: 'Farmhouse', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },
  { key: 'ROOM', label: 'Single / Independent Room', category: 'RESIDENTIAL', allowedPurposes: ['RENT', 'PG'] },
  { key: 'PG', label: 'PG Accommodation', category: 'RESIDENTIAL', allowedPurposes: ['PG'] },
  { key: 'HOSTEL', label: 'Hostel Room', category: 'RESIDENTIAL', allowedPurposes: ['PG', 'RENT'] },
  { key: 'BUILDER_FLOOR', label: 'Builder Floor', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT'] },
  { key: 'STUDIO', label: 'Studio Apartment', category: 'RESIDENTIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },

  // Commercial Types
  { key: 'SHOP', label: 'Dukaan / Shop Space', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'OFFICE', label: 'Commercial Office Space', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'SHOWROOM', label: 'Showroom Space', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'WAREHOUSE', label: 'Warehouse / Godown', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'COMMERCIAL_BUILDING', label: 'Entire Commercial Building', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'CO_WORKING', label: 'Co-Working Desk / Space', category: 'COMMERCIAL', allowedPurposes: ['RENT', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'INDUSTRIAL_PROPERTY', label: 'Industrial Shed / Property', category: 'COMMERCIAL', allowedPurposes: ['SALE', 'LEASE', 'COMMERCIAL_LEASE'] },

  // Land Types
  { key: 'RESIDENTIAL_PLOT', label: 'Residential Plot / Basti Plot', category: 'LAND', allowedPurposes: ['SALE', 'LEASE'] },
  { key: 'COMMERCIAL_PLOT', label: 'Commercial Plot', category: 'LAND', allowedPurposes: ['SALE', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'AGRICULTURAL_LAND', label: 'Kheti ki Zameen (Agricultural Land)', category: 'LAND', allowedPurposes: ['SALE', 'LEASE'] },
  { key: 'FARM_LAND', label: 'Farm Land', category: 'LAND', allowedPurposes: ['SALE', 'LEASE'] },
  { key: 'INDUSTRIAL_LAND', label: 'Industrial Land', category: 'LAND', allowedPurposes: ['SALE', 'LEASE', 'COMMERCIAL_LEASE'] },
  { key: 'LAND_PARCEL', label: 'Badi Zameen (Large Land Parcel)', category: 'LAND', allowedPurposes: ['SALE', 'LEASE'] },

  // Special Types
  { key: 'HALL', label: 'Hall', category: 'SPECIAL', allowedPurposes: ['RENT', 'LEASE'] },
  { key: 'MARRIAGE_HALL', label: 'Marriage / Banquet Hall', category: 'SPECIAL', allowedPurposes: ['RENT', 'LEASE'] },
  { key: 'GUEST_HOUSE', label: 'Guest House', category: 'SPECIAL', allowedPurposes: ['RENT', 'LEASE'] },
  { key: 'HOTEL', label: 'Hotel / Resort', category: 'SPECIAL', allowedPurposes: ['SALE', 'LEASE'] },
  { key: 'SCHOOL', label: 'School / Institute Building', category: 'SPECIAL', allowedPurposes: ['SALE', 'LEASE'] },
  { key: 'OTHER', label: 'Other Property Type', category: 'SPECIAL', allowedPurposes: ['SALE', 'RENT', 'LEASE'] },
];

export const AREA_UNITS: { key: AreaUnit; label: string }[] = [
  { key: 'SQ_FT', label: 'Sq. Ft.' },
  { key: 'SQ_MT', label: 'Sq. Meter' },
  { key: 'SQ_YARD', label: 'Gaj (Sq. Yard)' },
  { key: 'ACRE', label: 'Acre (Ekar)' },
  { key: 'BIGHA', label: 'Bigha' },
  { key: 'BISWA', label: 'Biswa' },
  { key: 'HECTARE', label: 'Hectare' },
  { key: 'MARLA', label: 'Marla' },
  { key: 'KANAL', label: 'Kanal' },
];

export function getFilteredPropertyTypes(purpose: ListingPurpose, category: PropertyCategoryType): PropertyTypeOption[] {
  return PROPERTY_TYPES.filter(
    pt => pt.category === category && pt.allowedPurposes.includes(purpose)
  );
}
