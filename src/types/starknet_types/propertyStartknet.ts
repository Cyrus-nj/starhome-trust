export interface StarknetProperty {
  id: string | number;
  title: string | number;
  description: string | number;
  location_address: string | number;
  city: string | number;
  state: string | number;
  country: string | number;
  latitude: string | number;
  longitude: string | number;
  price: number;
  asking_price: number;
  currency: string | number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  property_type: string | number;
  status: string | number;
  interested_clients: number;
  annual_growth_rate: number;
  features_id: string | number;
  images_id: string | number;
  video_tour: string | number;
  agent_id: string | number;
  date_listed: number;
  has_garden: boolean;
  has_swimming_pool: boolean;
  pet_friendly: boolean;
  wheelchair_accessible: boolean;
  asset_token: string | number;
}