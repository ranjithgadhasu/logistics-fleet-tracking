import { Field, FormActions, FormSection, Input, Modal, Select } from "@/components/ui";
import { CITY_NAMES, DRIVER_STATUS } from "@/constants";
import { useForm } from "@/hooks/useForm";
import { useFleetStore } from "@/store/fleetStore";
import { toDateInput } from "@/utils/format";
import { email, maxLength, minLength, numberBetween, pattern, phone, required } from "@/utils/validators";

const notExpired = (v) => (v && new Date(String(v)).getTime() < Date.now() ? "License must not be expired" : undefined);

const rules = {
  name: [required("Full name is required"), minLength(3), maxLength(50), pattern(/^[a-zA-Z\s.'-]+$/, "Only letters, spaces and . ' -")],
  email: [required("Email is required"), email()],
  phone: [required("Phone is required"), phone()],
  licenseNumber: [required("License number is required"), pattern(/^[A-Z0-9-]{5,20}$/i, "5–20 letters, numbers or dashes")],
  licenseExpiry: [required("Expiry date is required"), notExpired],
  status: [required()],
  city: [required("Select a base city")],
  experienceYears: [required(), numberBetween(0, 50, "Experience must be 0–50 years")],
};

function toValues(d) {
  return {
    name: d?.name ?? "",
    email: d?.email ?? "",
    phone: d?.phone ?? "",
    licenseNumber: d?.licenseNumber ?? "",
    licenseExpiry: toDateInput(d?.licenseExpiry),
    status: d?.status ?? "available",
    city: d?.city ?? "",
    experienceYears: String(d?.experienceYears ?? 1),
    vehicleId: d?.vehicleId ?? "",
  };
}

function DriverForm({ driver, onDone }) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const createDriver = useFleetStore((s) => s.createDriver);
  const updateDriver = useFleetStore((s) => s.updateDriver);
  const { register: f, handleSubmit, formRef, submitting } = useForm(toValues(driver), rules);

  const onSubmit = handleSubmit(async (v) => {
    const input = {
      name: v.name.trim(),
      email: v.email.trim().toLowerCase(),
      phone: v.phone.trim(),
      licenseNumber: v.licenseNumber.trim().toUpperCase(),
      licenseExpiry: new Date(v.licenseExpiry).toISOString(),
      status: v.status,
      city: v.city,
      experienceYears: Number(v.experienceYears),
      vehicleId: v.vehicleId || null,
    };
    try {
      if (driver) await updateDriver(driver.id, input);
      else await createDriver(input);
      onDone();
    } catch {
      /* keep the form open – error toast already shown */
    }
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-7">
      <FormSection title="Personal information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={f("name").error} required className="sm:col-span-2">
            <Input {...f("name")} placeholder="Jordan Smith" autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="email" error={f("email").error} required>
            <Input {...f("email")} type="email" placeholder="jordan@fleetops.io" autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="phone" error={f("phone").error} required>
            <Input {...f("phone")} type="tel" placeholder="+1 (555) 123-4567" autoComplete="tel" />
          </Field>
          <Field label="Base city" htmlFor="city" error={f("city").error} required>
            <Select {...f("city")}>
              <option value="">Select city</option>
              {CITY_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Experience (years)" htmlFor="experienceYears" error={f("experienceYears").error} required>
            <Input {...f("experienceYears")} type="number" min={0} max={50} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="License">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="License number" htmlFor="licenseNumber" error={f("licenseNumber").error} required>
            <Input {...f("licenseNumber")} placeholder="CDL-123456" className="uppercase" />
          </Field>
          <Field label="License expiry" htmlFor="licenseExpiry" error={f("licenseExpiry").error} required>
            <Input {...f("licenseExpiry")} type="date" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Availability & vehicle">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" required>
            <Select {...f("status")}>
              {Object.entries(DRIVER_STATUS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Assigned vehicle" htmlFor="vehicleId" hint="Optional – can also be done from the vehicle page.">
            <Select {...f("vehicleId")}>
              <option value="">No vehicle</option>
              {vehicles
                .filter((v) => v.status !== "offline")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} · {v.make} {v.model}
                    {v.driverId && v.driverId !== driver?.id ? " (assigned)" : ""}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} submitting={submitting} submitLabel={driver ? "Save changes" : "Add driver"} />
    </form>
  );
}

export function DriverFormModal({ open, onClose, driver }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={driver ? `Edit ${driver.name}` : "Add driver"}
      description={driver ? "Update profile, license and availability." : "Onboard a new driver to your team."}
    >
      {open && <DriverForm key={driver?.id ?? "new"} driver={driver} onDone={onClose} />}
    </Modal>
  );
}
