import { useCallback, useRef, useState } from "react";

/**
 * Lightweight form state + validation hook.
 * - validates a field on blur
 * - re-validates touched / already-invalid fields on change
 * - validates everything on submit and focuses the first invalid field
 *
 * @param {Record<string,string>} initialValues
 * @param {Record<string, Array<(value:any, all:object)=>string|undefined>>} rules
 */
export function useForm(initialValues, rules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  const validateField = useCallback(
    (name, all) => {
      for (const rule of rules[name] ?? []) {
        const msg = rule(all[name], all);
        if (msg) return msg;
      }
      return undefined;
    },
    [rules],
  );

  const validateAll = useCallback(
    (all) => {
      const next = {};
      Object.keys(rules).forEach((k) => {
        const msg = validateField(k, all);
        if (msg) next[k] = msg;
      });
      return next;
    },
    [rules, validateField],
  );

  const setValue = (name, value) => {
    const next = { ...values, [name]: value };
    setValues((prev) => ({ ...prev, [name]: value }));
    // re-check this field (if touched) plus any field already showing an error,
    // so cross-field rules (e.g. "ETA after pickup") clear themselves.
    setErrors((e) => {
      const out = { ...e };
      const toCheck = new Set(Object.keys(e));
      if (touched[name]) toCheck.add(name);
      toCheck.forEach((k) => {
        const msg = validateField(k, next);
        if (msg) out[k] = msg;
        else delete out[k];
      });
      return out;
    });
  };

  /** Spread onto <Input>/<Select>: `<Input {...register("email")} />` */
  const register = (name) => ({
    name,
    id: name,
    value: values[name] ?? "",
    onChange: (e) => setValue(name, e.target.value),
    onBlur: () => {
      setTouched((t) => ({ ...t, [name]: true }));
      setErrors((e) => {
        const msg = validateField(name, values);
        const out = { ...e };
        if (msg) out[name] = msg;
        else delete out[name];
        return out;
      });
    },
    error: errors[name],
  });

  const handleSubmit = (onValid) => async (e) => {
    e?.preventDefault();
    const found = validateAll(values);
    setErrors(found);
    setTouched(Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    try {
      setSubmitting(true);
      await onValid(values);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = (next) => {
    setValues(next ?? initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, setValue, register, handleSubmit, reset, submitting, formRef };
}
