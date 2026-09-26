import type { FormEvent } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { useNavigation, useSubmit } from "react-router";
import type { z } from "zod";

/** Shared Zod rules, RHF field state, and React Router SSR form submission. */
export function useAuthForm<T extends FieldValues>(
  schema: z.ZodType<T>,
  defaultValues?: DefaultValues<T>,
) {
  const form = useForm<T>({ defaultValues });
  const submit = useSubmit();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    form.clearErrors();
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) {
      const seen = new Set<string>();
      for (const issue of parsed.error.issues) {
        const name = String(issue.path[0]);
        if (seen.has(name)) continue;
        form.setError(
          name as Path<T>,
          { type: "validate", message: issue.message },
          { shouldFocus: seen.size === 0 },
        );
        seen.add(name);
      }
      return;
    }
    void submit(event.currentTarget, { method: "post" });
  }
  return { ...form, onSubmit, busy };
}
