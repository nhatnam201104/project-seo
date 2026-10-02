export type Address = {
  id: string;
  receiver_name: string;
  receiver_phone: string;
  line: string;
  ward: string | null;
  district: string | null;
  city: string;
  is_default: boolean;
};

export type AddressInput = {
  receiver_name: string;
  receiver_phone: string;
  line: string;
  ward: string;
  district: string;
  city: string;
  is_default: boolean;
};
