"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTRPC } from "@/trpc/client";
import { useTracking } from "@/modules/analytics/player/usePlayerAnalytics";
import type { LeadForm } from "@/modules/types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LeadField = LeadForm["fields"][number];
type FieldValues = Record<string, string | string[]>;

function buildSchema(fields: LeadField[]) {
  const shape = Object.fromEntries(
    fields.map((field) => [
      field.id,
      field.type === "checkbox"
        ? z.array(z.string()).min(1, "Select at least one option.")
        : z.string().trim().min(1, "This field is required."),
    ]),
  );
  return z.object(shape);
}

function inputTypeFor(label: string) {
  if (/e-?mail/i.test(label)) return "email";
  if (/phone|mobile/i.test(label)) return "tel";
  return "text";
}

function autoCompleteFor(label: string) {
  if (/e-?mail/i.test(label)) return "email";
  if (/phone|mobile/i.test(label)) return "tel";
  if (/name/i.test(label)) return "name";
  return "on";
}

// Checkbox answers are stored as string arrays in the form, but the API
// expects every answer as a plain string — same wire format as before.
function serializeAnswers(values: FieldValues): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      Array.isArray(value) ? JSON.stringify(value) : value.trim(),
    ]),
  );
}

export function ViewerLeadForm({
  form: leadForm,
  videoId,
  onComplete,
}: {
  form: LeadForm;
  videoId: string;
  onComplete: () => void;
}) {
  const trpc = useTRPC();
  const analytics = useTracking();
  const mutation = useMutation(trpc.videoPlayer.submitLead.mutationOptions());
  const [success, setSuccess] = useState(false);

  const fields = useMemo(
    () => [...leadForm.fields].sort((a, b) => a.position - b.position),
    [leadForm.fields],
  );
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.id, field.type === "checkbox" ? [] : ""]),
      ) as FieldValues,
    [fields],
  );

  const form = useForm<FieldValues>({
    // The schema shape is derived per form definition, so the resolver's
    // inferred type won't line up statically with FieldValues.
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  const attempt = useRef<{
    id: string;
    sessionId: string;
    skipped: boolean;
    answers: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    analytics.track(
      "lead_form_opened",
      { form_id: leadForm.id },
      `form-open-${leadForm.id}`,
    );
  }, [analytics, leadForm.id]);

  async function submit(values: FieldValues, skipped: boolean) {
    if (mutation.isPending) return;

    // Preserve both the identifier and payload on retry after an uncertain response.
    attempt.current ??= {
      id: crypto.randomUUID(),
      sessionId: analytics.playbackID() || crypto.randomUUID(),
      skipped,
      answers: skipped ? {} : serializeAnswers(values),
    };

    try {
      await mutation.mutateAsync({
        ...attempt.current,
        videoId,
        formId: leadForm.id,
        formVersion: leadForm.version,
      });
      analytics.track(
        attempt.current.skipped ? "lead_form_skipped" : "lead_form_submitted",
        { form_id: leadForm.id, submission_id: attempt.current.id },
        `submission-${attempt.current.id}`,
      );
      if (attempt.current.skipped) onComplete();
      else setSuccess(true);
    } catch (error) {
      analytics.track("lead_form_failed", { form_id: leadForm.id });
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your details. Please try again.";
      // A server validation response is definitive; allow corrected input.
      if (!/unable to save|timeout|network/i.test(message))
        attempt.current = null;
      form.setError("root", { message });
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
      <section
        aria-label="Contact details"
        className="w-full max-w-md rounded-2xl border-[0.5px] border-border bg-background p-5 text-foreground shadow-2xl sm:p-7"
      >
        {success ? (
          <div className="space-y-4 py-3 text-center" role="status">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="size-5" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              You're all set
            </h2>
            <p className="text-sm text-muted-foreground">
              Your details have been sent successfully.
            </p>
            <Button autoFocus onClick={onComplete} className="w-full">
              {leadForm.placement === "after_video"
                ? "Continue"
                : "Continue watching"}
            </Button>
          </div>
        ) : (
          <form
            onChange={() =>
              analytics.track(
                "lead_form_started",
                { form_id: leadForm.id },
                `form-start-${leadForm.id}`,
              )
            }
            onSubmit={form.handleSubmit((values) => submit(values, false))}
            className="space-y-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                <Mail className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Let's stay in touch
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {leadForm.placement === "after_video"
                    ? "Leave your details to hear more."
                    : "Share your details to continue watching."}
                </p>
              </div>
            </div>

            <FieldGroup>
              {fields.map((field, index) => {
                if (field.type === "checkbox") {
                  return (
                    <Controller
                      key={field.id}
                      name={field.id}
                      control={form.control}
                      render={({ field: rhfField, fieldState }) => {
                        const selected = (rhfField.value as string[]) ?? [];
                        return (
                          <FieldSet>
                            <FieldLegend
                              className=" capitalize"
                              variant="label"
                            >
                              {field.label}{" "}
                              <span className="text-muted-foreground">*</span>
                            </FieldLegend>
                            <FieldGroup
                              data-slot="checkbox-group"
                              className="grid gap-2 sm:grid-cols-2"
                            >
                              {field.options?.map((option) => (
                                <Field
                                  key={option.id}
                                  orientation="horizontal"
                                  data-invalid={fieldState.invalid}
                                  className="rounded-lg border-[0.5px] border-border px-3 py-2.5"
                                >
                                  <Checkbox
                                    id={`lead-${option.id}`}
                                    name={rhfField.name}
                                    aria-invalid={fieldState.invalid}
                                    checked={selected.includes(option.label)}
                                    onCheckedChange={(checked) =>
                                      rhfField.onChange(
                                        checked
                                          ? [...selected, option.label]
                                          : selected.filter(
                                              (value) => value !== option.label,
                                            ),
                                      )
                                    }
                                    className="border-neutral-300  data-[state=checked]:border-[#d1ff46] data-[state=checked]:bg-[#d1ff46] data-[state=checked]:!text-black [&_svg]:!stroke-black [&_svg_path]:!stroke-black focus-visible:ring-[#d1ff46]/50"
                                  />
                                  <FieldLabel
                                    htmlFor={`lead-${option.id}`}
                                    className=" capitalize"
                                  >
                                    {option.label}
                                  </FieldLabel>
                                </Field>
                              ))}
                            </FieldGroup>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldSet>
                        );
                      }}
                    />
                  );
                }

                if (field.type === "dropdown") {
                  return (
                    <Controller
                      key={field.id}
                      name={field.id}
                      control={form.control}
                      render={({ field: rhfField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`lead-${field.id}`}>
                            {field.label}{" "}
                            <span className="text-muted-foreground">*</span>
                          </FieldLabel>
                          <Select
                            name={rhfField.name}
                            value={rhfField.value as string}
                            onValueChange={rhfField.onChange}
                          >
                            <SelectTrigger
                              id={`lead-${field.id}`}
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem
                                  key={option.id}
                                  value={option.label}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  );
                }

                return (
                  <Controller
                    key={field.id}
                    name={field.id}
                    control={form.control}
                    render={({ field: rhfField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          className=" capitalize"
                          htmlFor={`lead-${field.id}`}
                        >
                          {field.label}{" "}
                          <span className="text-muted-foreground">*</span>
                        </FieldLabel>
                        <Input
                          className="rounded-md"
                          {...rhfField}
                          id={`lead-${field.id}`}
                          autoFocus={index === 0}
                          type={inputTypeFor(field.label)}
                          autoComplete={autoCompleteFor(field.label)}
                          maxLength={4000}
                          placeholder={field.label}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                );
              })}
            </FieldGroup>

            {form.formState.errors.root && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive"
              >
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full primary-btn rounded-md gap-2"
            >
              {mutation.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Submit details
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {leadForm.allowSkip && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => void submit({}, true)}
                className="w-full text-xs font-normal secondary-btn rounded-md text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
