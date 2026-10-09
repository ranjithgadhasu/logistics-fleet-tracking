/**
 * Domain models for FleetOps, documented with JSDoc.
 * These are the data shapes the app expects from the REST API
 * (or the built-in mock API). This file contains no runtime code.
 *
 * @typedef {{ lat: number, lng: number }} LatLng
 * @typedef {LatLng & { address: string, city: string }} Place
 *
 * @typedef {"active" | "idle" | "maintenance" | "offline"} VehicleStatus
 * @typedef {Object} Vehicle
 * @property {string} id               e.g. "VH-201"
 * @property {string} plateNumber
 * @property {string} make
 * @property {string} model
 * @property {number} year
 * @property {"Truck"|"Van"|"Trailer"|"Pickup"|"Refrigerated"} type
 * @property {VehicleStatus} status
 * @property {"Diesel"|"Petrol"|"Electric"|"CNG"} fuelType
 * @property {number} fuelLevel        0 - 100 (%)
 * @property {number} fuelEfficiency   km per litre
 * @property {number} capacityKg
 * @property {number} mileage          km
 * @property {string} lastServiceDate  ISO date
 * @property {string} nextServiceDate  ISO date
 * @property {string|null} driverId
 * @property {string} city
 * @property {LatLng} location
 * @property {number} speed            km/h
 * @property {string} createdAt
 *
 * @typedef {"available" | "on-duty" | "off-duty" | "on-leave"} DriverStatus
 * @typedef {Object} Driver
 * @property {string} id               e.g. "DRV-101"
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} licenseNumber
 * @property {string} licenseExpiry
 * @property {DriverStatus} status
 * @property {string|null} vehicleId
 * @property {string} city
 * @property {number} rating           1 - 5
 * @property {number} experienceYears
 * @property {string} joinedAt
 *
 * @typedef {"pending"|"assigned"|"in-transit"|"delivered"|"delayed"|"cancelled"} ShipmentStatus
 * @typedef {"low"|"normal"|"high"|"urgent"} ShipmentPriority
 * @typedef {{ name: string, company: string, email: string, phone: string }} Customer
 * @typedef {{ id: string, status: ShipmentStatus, note: string, date: string, city?: string }} ShipmentEvent
 * @typedef {Object} Shipment
 * @property {string} id               e.g. "SHP-10234"
 * @property {Customer} customer
 * @property {Place} pickup
 * @property {Place} delivery
 * @property {string|null} driverId
 * @property {string|null} vehicleId
 * @property {ShipmentStatus} status
 * @property {ShipmentPriority} priority
 * @property {string} cargo
 * @property {number} weightKg
 * @property {number} distanceKm
 * @property {number} progress         0 - 100
 * @property {string} pickupDate
 * @property {string} eta
 * @property {string|null} deliveredAt
 * @property {string} createdAt
 * @property {ShipmentEvent[]} history
 *
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {"delay"|"maintenance"|"delivery"|"driver"|"system"} type
 * @property {"info"|"success"|"warning"|"critical"} severity
 * @property {string} title
 * @property {string} message
 * @property {string} createdAt
 * @property {boolean} read
 * @property {string} [link]
 *
 * @typedef {Object} Activity
 * @property {string} id
 * @property {"vehicle"|"driver"|"shipment"} entityType
 * @property {string} entityId
 * @property {"created"|"updated"|"status"|"assignment"|"maintenance"|"fuel"|"trip"|"deleted"} kind
 * @property {string} message
 * @property {string} date
 */

export {};
