export type UserRole = "renter" | "owner" | "admin";
export type AccountStatus = "active" | "suspended";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
  status: AccountStatus;
  createdAt: string;
};

export type CarStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "inactive";

export type VehicleType = "Sedan" | "SUV" | "Pickup" | "Van" | "Hatchback";

export type DemoCar = {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  vehicleType?: VehicleType;
  transmission: "Automatic" | "Manual";
  seats: number;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  pricePerDay: number;
  photos: string[];
  description: string;
  status: CarStatus;
  unavailableDates: string[];
  createdAt: string;
};

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "declined"
  | "cancelled"
  | "disputed"
  | "resolved";

export type PaymentStatus = "unpaid" | "held" | "refunded";

export type DemoBooking = {
  id: string;
  carId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  subtotal: number;
  fee: number;
  total: number;
  transactionReference: string | null;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

export type DemoReview = {
  id: string;
  bookingId: string;
  carId: string;
  renterId: string;
  ownerId: string;
  rating: number;
  comment: string;
  ownerReply: string | null;
  createdAt: string;
};

export type DemoDispute = {
  id: string;
  bookingId: string;
  openedBy: string;
  reason: string;
  description: string;
  status: "open" | "resolved";
  resolutionNotes: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type DemoAnnouncement = {
  id: string;
  title: string;
  message: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
};

export type DemoSession = {
  userId: string;
  startedAt: string;
};

export type DemoData = {
  users: DemoUser[];
  cars: DemoCar[];
  bookings: DemoBooking[];
  reviews: DemoReview[];
  disputes: DemoDispute[];
  announcements: DemoAnnouncement[];
};

export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
