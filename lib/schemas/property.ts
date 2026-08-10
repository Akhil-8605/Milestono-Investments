import { z } from "zod";

export const basicDetailsSchema = z.object({
  propertyName: z.string().min(3, "Property name must be at least 3 characters"),
  propertyType: z.enum([
    "Apartment", "Villa", "Plot", "Commercial Office", 
    "Retail Shop", "Warehouse", "Industrial", "Land", "Agriculture Land"
  ]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  constructionStatus: z.enum(["Ready", "Under Construction", "Upcoming"]),
  tickerId: z.string().min(2, "Ticker ID must be at least 2 characters").max(4, "Ticker ID must be max 4 characters").regex(/^[A-Z0-9]+$/, "Ticker ID must be uppercase alphanumeric"),
});

export const specificationsSchema = z.object({
  areaType: z.enum(["Built-up Area", "Carpet Area", "Plot Area"]),
  areaValue: z.number().positive("Area must be positive"),
  floorNumber: z.number().min(0, "Floor number cannot be negative").optional(),
  totalFloors: z.number().positive("Total floors must be positive").optional(),
  bedrooms: z.number().min(0, "Bedrooms cannot be negative").optional(),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative").optional(),
  balconies: z.number().min(0, "Balconies cannot be negative").optional(),
  furnishedStatus: z.enum(["Fully Furnished", "Semi-Furnished", "Unfurnished"]).optional(),
  ageOfProperty: z.number().min(0, "Age cannot be negative").optional(),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
});

export const locationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  areaLocality: z.string().min(1, "Area/Locality is required"),
  fullAddress: z.string().min(10, "Full address must be at least 10 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  landmark: z.string().optional(),
  pincode: z.string().min(4, "Pincode is required"),
});

export const investmentInfoSchema = z.object({
  totalPropertyPrice: z.number().positive("Total property price must be positive"),
  totalInvestmentUnits: z.number().positive("Total investment units must be positive"),
  minimumInvestment: z.number().min(1, "Minimum investment must be at least 1").default(1),
  maximumUnitsPerInvestor: z.number().min(1, "Maximum units must be positive").optional().or(z.nan()),
  rentalYield: z.number().min(0).optional().or(z.nan()),
  expectedAppreciation: z.number().min(0).optional().or(z.nan()),
});

export const mediaSchema = z.object({
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  masterPlan: z.string().url().optional().or(z.literal("")),
  floorPlan: z.string().url().optional().or(z.literal("")),
  brochurePdf: z.string().url().optional().or(z.literal("")),
  documentsPdf: z.string().url().optional().or(z.literal("")),
});

export const legalVerificationSchema = z.object({
  reraNumber: z.string().regex(/^[a-zA-Z0-9-\/]+$/, "Invalid RERA Number format"),
  propertyRegistrationNumber: z.string().regex(/^[a-zA-Z0-9-\/]+$/, "Invalid Registration Number format"),
  ownershipProofUrl: z.string().url("Ownership proof is required"),
  taxReceiptsUrl: z.string().url().optional().or(z.literal("")),
  occupancyCertificateUrl: z.string().url("Occupancy Certificate is required"),
});

export const developerInfoSchema = z.object({
  companyName: z.string().min(2, "Company Name is required"),
  developerId: z.string().min(3, "Developer ID is required"),
  contactPerson: z.string().min(2, "Contact Person is required"),
  mobile: z.string().min(10, "Mobile must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  website: z.string().url().optional().or(z.literal("")),
});

export const propertyFormSchema = z.object({
  basicDetails: basicDetailsSchema,
  specifications: specificationsSchema,
  location: locationSchema,
  investmentInfo: investmentInfoSchema,
  media: mediaSchema,
  legalVerification: legalVerificationSchema,
  developerInfo: developerInfoSchema,
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
