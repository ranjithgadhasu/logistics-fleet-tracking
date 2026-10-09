import { Field, FormActions, FormSection, Input, Modal, Select } from "@/components/ui";
import { CITY_NAMES, FUEL_TYPES, VEHICLE_STATUS, VEHICLE_TYPES } from "@/constants";
import { useForm } from "@/hooks/useForm";
import { useFleetStore } from "@/store/fleetStore";
import { toDateInput } from "@/utils/format";
import { dateAfter, maxLength, minLength, numberBetween, pattern, required } from "@/utils/validators";

const currentYear = new Date().getFullYear();

const rules = {
  plateNumber: [required("Plate number is required"), pattern(/^[A-Z0-9-\s]{4,14}$/i, "Use 4–14 letters, numbers or dashes")],
  make: [required(), minLength(2), maxLength(30)],
  model: [required(), maxLength(30)],
  year: [required(), numberBetween(1990, currentYear + 1, `Year must be 1990–${currentYear + 1}`)],
  type: [required("Select a vehicle type")],
  status: [required()],
  fuelType: [required()],
  fuelLevel: [required(), numberBetween(0, 100, "Fuel level must be 0–100%")],
  fuelEfficiency: [required(), numberBetween(0.5, 40)],
  capacityKg: [required(), numberBetween(100, 50000, "Capacity must be 100–50,000 kg")],
  mileage: [required(), numberBetween(0, 2_000_000)],
  lastServiceDate: [required("Last service date is required")],
  nextServiceDate: [required("Next service date is required"), dateAfter("lastServiceDate", "Must be after the last service date")],
  city: [required("Select a home city")],
};

function toValues(v) {
  const today = new Date();
  const in6m = new Date(today.getTime() + 180 * 86_400_000);
  return {
    plateNumber: v?.plateNumber ?? "",
    make: v?.make ?? "",
    model: v?.model ?? "",
    year: String(v?.year ?? currentYear),
    type: v?.type ?? "",
    status: v?.status ?? "idle",
    fuelType: v?.fuelType ?? "Diesel",
    fuelLevel: String(v?.fuelLevel ?? 100),
    fuelEfficiency: String(v?.fuelEfficiency ?? 8),
    capacityKg: String(v?.capacityKg ?? ""),
    mileage: String(v?.mileage ?? 0),
    lastServiceDate: toDateInput(v?.lastServiceDate ?? today.toISOString()),
    nextServiceDate: toDateInput(v?.nextServiceDate ?? in6m.toISOString()),
    city: v?.city ?? "",
    driverId: v?.driverId ?? "",
  };
}

function VehicleForm({ vehicle, onDone }) {
  const drivers = useFleetStore((s) => s.drivers);
  const createVehicle = useFleetStore((s) => s.createVehicle);
  const updateVehicle = useFleetStore((s) => s.updateVehicle);
  const { register: f, handleSubmit, formRef, submitting } = useForm(toValues(vehicle), rules);

  const onSubmit = handleSubmit(async (v) => {
    const input = {
      plateNumber: v.plateNumber.trim().toUpperCase(),
      make: v.make.trim(),
      model: v.model.trim(),
      year: Number(v.year),
      type: v.type,
      status: v.status,
      fuelType: v.fuelType,
      fuelLevel: Number(v.fuelLevel),
      fuelEfficiency: Number(v.fuelEfficiency),
      capacityKg: Number(v.capacityKg),
      mileage: Number(v.mileage),
      lastServiceDate: new Date(v.lastServiceDate).toISOString(),
      nextServiceDate: new Date(v.nextServiceDate).toISOString(),
      city: v.city,
      driverId: v.driverId || null,
    };
    try {
      if (vehicle) await updateVehicle(vehicle.id, input);
      else await createVehicle(input);
      onDone();
    } catch {
      /* toast already shown – keep the form open */
    }
  });

  const isLive = vehicle?.status === "active";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-7">
      <FormSection title="Vehicle details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plate number" htmlFor="plateNumber" error={f("plateNumber").error} required>
            <Input {...f("plateNumber")} placeholder="TX-4821-KL" className="uppercase" />
          </Field>
          <Field label="Vehicle type" htmlFor="type" error={f("type").error} required>
            <Select {...f("type")}>
              <option value="">Select type</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Make" htmlFor="make" error={f("make").error} required>
            <Input {...f("make")} placeholder="Volvo" />
          </Field>
          <Field label="Model" htmlFor="model" error={f("model").error} required>
            <Input {...f("model")} placeholder="VNL 860" />
          </Field>
          <Field label="Year" htmlFor="year" error={f("year").error} required>
            <Input {...f("year")} type="number" inputMode="numeric" />
          </Field>
          <Field label="Capacity (kg)" htmlFor="capacityKg" error={f("capacityKg").error} required>
            <Input {...f("capacityKg")} type="number" inputMode="numeric" placeholder="18000" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Status & assignment">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" error={f("status").error} hint={isLive ? "Vehicle is on a live trip" : undefined} required>
            <Select {...f("status")}>
              {Object.entries(VEHICLE_STATUS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Home city" htmlFor="city" error={f("city").error} required>
            <Select {...f("city")}>
              <option value="">Select city</option>
              {CITY_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assigned driver" htmlFor="driverId" className="sm:col-span-2" hint="Assigning a driver who already has a vehicle will move them to this one.">
            <Select {...f("driverId")}>
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.vehicleId && d.vehicleId !== vehicle?.id ? `(currently ${d.vehicleId})` : d.status === "available" ? "· available" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Fuel & maintenance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fuel type" htmlFor="fuelType" required>
            <Select {...f("fuelType")}>
              {FUEL_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fuel / charge level (%)" htmlFor="fuelLevel" error={f("fuelLevel").error} required>
            <Input {...f("fuelLevel")} type="number" min={0} max={100} />
          </Field>
          <Field label="Efficiency (km/L)" htmlFor="fuelEfficiency" error={f("fuelEfficiency").error} required>
            <Input {...f("fuelEfficiency")} type="number" step="0.1" />
          </Field>
          <Field label="Odometer (km)" htmlFor="mileage" error={f("mileage").error} required>
            <Input {...f("mileage")} type="number" inputMode="numeric" />
          </Field>
          <Field label="Last service" htmlFor="lastServiceDate" error={f("lastServiceDate").error} required>
            <Input {...f("lastServiceDate")} type="date" />
          </Field>
          <Field label="Next service due" htmlFor="nextServiceDate" error={f("nextServiceDate").error} required>
            <Input {...f("nextServiceDate")} type="date" />
          </Field>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} submitting={submitting} submitLabel={vehicle ? "Save changes" : "Add vehicle"} />
    </form>
  );
}

export function VehicleFormModal({ open, onClose, vehicle }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={vehicle ? `Edit ${vehicle.plateNumber}` : "Add vehicle"}
      description={vehicle ? "Update vehicle details, assignment and maintenance info." : "Register a new vehicle in your fleet."}
    >
      {open && <VehicleForm key={vehicle?.id ?? "new"} vehicle={vehicle} onDone={onClose} />}
    </Modal>
  );
}
