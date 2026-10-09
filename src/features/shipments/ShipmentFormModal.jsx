import { useMemo } from "react";
import { Route } from "lucide-react";
import { Field, FormActions, FormSection, Input, Modal, Select } from "@/components/ui";
import { CITY_NAMES, DRIVER_STATUS, findCity, PRIORITY } from "@/constants";
import { useForm } from "@/hooks/useForm";
import { useFleetStore } from "@/store/fleetStore";
import { formatNumber, toDateTimeInput } from "@/utils/format";
import { roadDistanceKm } from "@/utils/geo";
import { dateAfter, email, maxLength, minLength, notEqualTo, numberBetween, phone, required } from "@/utils/validators";

function toValues(s) {
  const pickup = new Date(Date.now() + 4 * 3_600_000);
  const eta = new Date(Date.now() + 28 * 3_600_000);
  return {
    customerName: s?.customer.name ?? "",
    customerCompany: s?.customer.company ?? "",
    customerEmail: s?.customer.email ?? "",
    customerPhone: s?.customer.phone ?? "",
    pickupCity: s?.pickup.city ?? "",
    pickupAddress: s?.pickup.address ?? "",
    deliveryCity: s?.delivery.city ?? "",
    deliveryAddress: s?.delivery.address ?? "",
    cargo: s?.cargo ?? "",
    weightKg: s ? String(s.weightKg) : "",
    priority: s?.priority ?? "normal",
    pickupDate: toDateTimeInput(s?.pickupDate ?? pickup.toISOString()),
    eta: toDateTimeInput(s?.eta ?? eta.toISOString()),
    driverId: s?.driverId ?? "",
    vehicleId: s?.vehicleId ?? "",
  };
}

function toPlace(city, address) {
  const c = findCity(city);
  return { city, address: address.trim(), lat: c.lat, lng: c.lng };
}

function ShipmentForm({ shipment, onDone }) {
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const createShipment = useFleetStore((s) => s.createShipment);
  const updateShipment = useFleetStore((s) => s.updateShipment);

  const rules = useMemo(
    () => ({
      customerName: [required("Contact name is required"), minLength(2), maxLength(60)],
      customerCompany: [required("Company is required"), maxLength(60)],
      customerEmail: [required("Email is required"), email()],
      customerPhone: [required("Phone is required"), phone()],
      pickupCity: [required("Select a pickup city")],
      pickupAddress: [required("Pickup address is required"), minLength(5)],
      deliveryCity: [required("Select a delivery city"), notEqualTo("pickupCity", "Delivery city must differ from pickup")],
      deliveryAddress: [required("Delivery address is required"), minLength(5)],
      cargo: [required("Describe the cargo"), maxLength(80)],
      weightKg: [
        required("Weight is required"),
        numberBetween(1, 50000, "Weight must be 1–50,000 kg"),
        (v, all) => {
          const veh = vehicles.find((x) => x.id === all?.vehicleId);
          return veh && Number(v) > veh.capacityKg ? `Exceeds vehicle capacity (${formatNumber(veh.capacityKg)} kg)` : undefined;
        },
      ],
      priority: [required()],
      pickupDate: [required("Pickup date is required")],
      eta: [required("Estimated delivery is required"), dateAfter("pickupDate", "Must be after the pickup time")],
      vehicleId: [(v, all) => (all?.driverId && !v ? "Select a vehicle for this driver" : undefined)],
      driverId: [(v, all) => (all?.vehicleId && !v ? "Select a driver for this vehicle" : undefined)],
    }),
    [vehicles],
  );

  const { register: f, handleSubmit, formRef, submitting, values, setValue } = useForm(toValues(shipment), rules);

  const distance = useMemo(() => {
    const a = findCity(values.pickupCity);
    const b = findCity(values.deliveryCity);
    return a && b && a !== b ? roadDistanceKm(a, b) : null;
  }, [values.pickupCity, values.deliveryCity]);

  const onSubmit = handleSubmit(async (v) => {
    const input = {
      customer: { name: v.customerName.trim(), company: v.customerCompany.trim(), email: v.customerEmail.trim(), phone: v.customerPhone.trim() },
      pickup: toPlace(v.pickupCity, v.pickupAddress),
      delivery: toPlace(v.deliveryCity, v.deliveryAddress),
      cargo: v.cargo.trim(),
      weightKg: Number(v.weightKg),
      priority: v.priority,
      pickupDate: new Date(v.pickupDate).toISOString(),
      eta: new Date(v.eta).toISOString(),
      driverId: v.driverId || null,
      vehicleId: v.vehicleId || null,
    };
    try {
      if (shipment) await updateShipment(shipment.id, input);
      else await createShipment(input);
      onDone();
    } catch {
      /* keep the form open */
    }
  });

  const driverField = f("driverId");

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-7">
      <FormSection title="Customer" description="Who is this shipment for?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="customerCompany" error={f("customerCompany").error} required>
            <Input {...f("customerCompany")} placeholder="Northwind Traders" />
          </Field>
          <Field label="Contact name" htmlFor="customerName" error={f("customerName").error} required>
            <Input {...f("customerName")} placeholder="Laura Bennett" />
          </Field>
          <Field label="Email" htmlFor="customerEmail" error={f("customerEmail").error} required>
            <Input {...f("customerEmail")} type="email" placeholder="laura@northwind.com" />
          </Field>
          <Field label="Phone" htmlFor="customerPhone" error={f("customerPhone").error} required>
            <Input {...f("customerPhone")} type="tel" placeholder="+1 (555) 000-1234" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Route">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup city" htmlFor="pickupCity" error={f("pickupCity").error} required>
            <Select {...f("pickupCity")}>
              <option value="">Select city</option>
              {CITY_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pickup address" htmlFor="pickupAddress" error={f("pickupAddress").error} required>
            <Input {...f("pickupAddress")} placeholder="1200 Commerce Blvd" />
          </Field>
          <Field label="Delivery city" htmlFor="deliveryCity" error={f("deliveryCity").error} required>
            <Select {...f("deliveryCity")}>
              <option value="">Select city</option>
              {CITY_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Delivery address" htmlFor="deliveryAddress" error={f("deliveryAddress").error} required>
            <Input {...f("deliveryAddress")} placeholder="88 Harbor Dr" />
          </Field>
        </div>
        {distance && (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm text-indigo-800">
            <Route className="h-4 w-4" />
            Estimated route: <strong>{formatNumber(distance)} km</strong> · ~{Math.ceil(distance / 62)} h driving time
          </div>
        )}
      </FormSection>

      <FormSection title="Cargo & schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cargo description" htmlFor="cargo" error={f("cargo").error} required>
            <Input {...f("cargo")} placeholder="Consumer electronics" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weight (kg)" htmlFor="weightKg" error={f("weightKg").error} required>
              <Input {...f("weightKg")} type="number" inputMode="numeric" placeholder="1200" />
            </Field>
            <Field label="Priority" htmlFor="priority" required>
              <Select {...f("priority")}>
                {Object.entries(PRIORITY).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Pickup time" htmlFor="pickupDate" error={f("pickupDate").error} required>
            <Input {...f("pickupDate")} type="datetime-local" />
          </Field>
          <Field label="Estimated delivery" htmlFor="eta" error={f("eta").error} required>
            <Input {...f("eta")} type="datetime-local" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Assignment" description="Optional — shipments without a driver stay pending.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Driver" htmlFor="driverId" error={driverField.error}>
            <Select
              {...driverField}
              onChange={(e) => {
                const id = e.target.value;
                setValue("driverId", id);
                const d = drivers.find((x) => x.id === id);
                if (d?.vehicleId) setValue("vehicleId", d.vehicleId);
              }}
            >
              <option value="">Unassigned</option>
              {drivers
                .filter((d) => d.status !== "on-leave" || d.id === shipment?.driverId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {DRIVER_STATUS[d.status].label}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Vehicle" htmlFor="vehicleId" error={f("vehicleId").error}>
            <Select {...f("vehicleId")}>
              <option value="">Unassigned</option>
              {vehicles
                .filter((v) => (v.status !== "maintenance" && v.status !== "offline") || v.id === shipment?.vehicleId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} · {v.type} · {formatNumber(v.capacityKg)} kg
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} submitting={submitting} submitLabel={shipment ? "Save changes" : "Create shipment"} />
    </form>
  );
}

export function ShipmentFormModal({ open, onClose, shipment }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={shipment ? `Edit ${shipment.id}` : "Create shipment"}
      description={shipment ? "Update customer, route, schedule or assignment." : "Book a new shipment and optionally assign it right away."}
    >
      {open && <ShipmentForm key={shipment?.id ?? "new"} shipment={shipment} onDone={onClose} />}
    </Modal>
  );
}
