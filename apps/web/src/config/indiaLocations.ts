// Lightweight, zero-dependency Indian states and cities list for lightning-fast autocomplete.
// Eliminates 2.5 MB synchronous country-state-city worldwide database bundle.

export interface StateData {
  name: string;
  code: string;
  cities: string[];
}

export const INDIAN_STATES: StateData[] = [
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    cities: [
      'Rewa',
      'Satna',
      'Sidhi',
      'Singrauli',
      'Maihar',
      'Jabalpur',
      'Bhopal',
      'Indore',
      'Gwalior',
      'Ujjain',
      'Sagar',
      'Katni',
      'Shahdol',
      'Anuppur',
      'Umaria',
      'Chhatarpur',
      'Damoh',
      'Panna',
      'Tikamgarh',
      'Niwari',
      'Vidisha',
      'Sehore',
      'Raisen',
      'Hoshangabad',
      'Narsinghpur',
      'Chhindwara',
      'Seoni',
      'Balaghat',
      'Mandla',
      'Dindori',
      'Dewas',
      'Ratlam',
      'Mandsaur',
      'Neemuch',
      'Khandwa',
      'Khargone',
      'Burhanpur',
      'Barwani',
      'Dhar',
      'Jhabua',
      'Alirajpur',
      'Betul',
      'Harda',
      'Guna',
      'Ashoknagar',
      'Shivpuri',
      'Datia',
      'Sheopur',
      'Bhind',
      'Morena',
      'Nagda',
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    cities: [
      'Prayagraj (Allahabad)',
      'Varanasi',
      'Lucknow',
      'Kanpur',
      'Noida',
      'Greater Noida',
      'Ghaziabad',
      'Agra',
      'Mirzapur',
      'Sonbhadra',
      'Banda',
      'Chitrakoot',
      'Jhansi',
      'Gorakhpur',
      'Bareilly',
      'Aligarh',
      'Moradabad',
      'Saharanpur',
      'Ayodhya',
      'Mathura',
    ],
  },
  {
    name: 'Delhi',
    code: 'DL',
    cities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Navi Mumbai', 'Aurangabad', 'Solapur'],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara'],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
  },
  {
    name: 'Bihar',
    code: 'BR',
    cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'],
  },
  {
    name: 'Haryana',
    code: 'HR',
    cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat'],
  },
  {
    name: 'Telangana',
    code: 'TG',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur'],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  },
  {
    name: 'Punjab',
    code: 'PB',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Nainital'],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  },
  {
    name: 'Odisha',
    code: 'OR',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  },
  {
    name: 'Kerala',
    code: 'KL',
    cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur'],
  },
  {
    name: 'Assam',
    code: 'AS',
    cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali'],
  },
  {
    name: 'Jammu & Kashmir',
    code: 'JK',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  },
  {
    name: 'Goa',
    code: 'GA',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    cities: ['Chandigarh'],
  },
  {
    name: 'Puducherry',
    code: 'PY',
    cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  },
  {
    name: 'Tripura',
    code: 'TR',
    cities: ['Agartala'],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    cities: ['Shillong', 'Tura'],
  },
  {
    name: 'Manipur',
    code: 'MN',
    cities: ['Imphal'],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    cities: ['Kohima', 'Dimapur'],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    cities: ['Itanagar', 'Naharlagun'],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    cities: ['Aizawl'],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    cities: ['Gangtok'],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    cities: ['Leh', 'Kargil'],
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    cities: ['Port Blair'],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    cities: ['Daman', 'Diu', 'Silvassa'],
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    cities: ['Kavaratti'],
  },
];

export const INDIAN_STATE_NAMES = INDIAN_STATES.map((s) => s.name);

export function getCitiesForState(stateName: string): string[] {
  const found = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === (stateName || '').toLowerCase(),
  );
  return found ? found.cities : [];
}
