"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { LeadForm } from "@/modules/types";

export function ViewerLeadForm({ form, videoId, onComplete }: { form: LeadForm; videoId: string; onComplete: () => void }) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.videoPlayer.submitLead.mutationOptions());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const attempt = useRef<{ id: string; sessionId: string; skipped: boolean; answers: Record<string, string> } | null>(null);
  const submitting = useRef(false);
  const fields = [...form.fields].sort((a, b) => a.position - b.position);

  async function submit(skipped: boolean) {
    if (submitting.current) return;
    const values = skipped ? {} : Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value.trim()]));
    if (!skipped && fields.some(field => !values[field.id] || values[field.id] === "[]")) { setError("Please complete all fields before continuing."); return; }
    submitting.current = true;
    setError("");
    // Preserve both the identifier and payload on retry after an uncertain response.
    attempt.current ??= { id: crypto.randomUUID(), sessionId: crypto.randomUUID(), skipped, answers: values };
    try {
      await mutation.mutateAsync({ ...attempt.current, videoId, formId: form.id });
      if (attempt.current.skipped) onComplete();
      else setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save your details. Please try again.");
      // A server validation response is definitive; allow corrected input.
      if (error instanceof Error && !/unable to save|timeout|network/i.test(error.message)) attempt.current = null;
    } finally { submitting.current = false; }
  }

  return <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
    <section aria-label="Contact details" className="w-full max-w-md rounded-2xl border border-border bg-background p-5 text-foreground shadow-2xl sm:p-7">
      {success ? <div className="space-y-4 py-3 text-center" role="status">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-5" /></span>
        <h2 className="text-xl font-semibold tracking-tight">You’re all set.</h2><p className="text-sm text-muted-foreground">Your details have been sent successfully.</p>
        <button autoFocus onClick={onComplete} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-neutral-950 hover:bg-primary/90">{form.placement === "after_video" ? "Continue" : "Continue watching"}</button>
      </div> : <form onSubmit={event => { event.preventDefault(); void submit(false); }} className="space-y-4">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Mail className="size-5" /></span><div><h2 className="text-lg font-semibold tracking-tight">Let’s stay in touch</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{form.placement === "after_video" ? "Leave your details to hear more." : "Share your details to continue watching."}</p></div></div>
        <fieldset disabled={mutation.isPending} className="space-y-3 disabled:opacity-60">
          {fields.map((field, index) => <div key={field.id} className="space-y-1.5">
            {field.type === "checkbox" ? <fieldset className="space-y-2"><legend className="mb-1.5 text-xs font-medium">{field.label} <span className="text-muted-foreground">*</span></legend><div className="grid gap-2 sm:grid-cols-2">{field.options?.map(option => {
              const selected: string[] = answers[field.id] ? JSON.parse(answers[field.id]) : [];
              return <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={selected.includes(option.label)} onChange={event => setAnswers(prev => ({ ...prev, [field.id]: JSON.stringify(event.target.checked ? [...selected, option.label] : selected.filter(value => value !== option.label)) }))} />{option.label}</label>;
            })}</div></fieldset> : <><label htmlFor={`lead-${field.id}`} className="text-xs font-medium">{field.label} <span className="text-muted-foreground">*</span></label>
            {field.type === "dropdown" ? <select id={`lead-${field.id}`} required value={answers[field.id] || ""} onChange={event => setAnswers(prev => ({ ...prev, [field.id]: event.target.value }))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="" disabled>Select an option</option>{field.options?.map(option => <option key={option.id} value={option.label}>{option.label}</option>)}</select> : <input autoFocus={index === 0} id={`lead-${field.id}`} required maxLength={4000} type={/e-?mail/i.test(field.label) ? "email" : /phone|mobile/i.test(field.label) ? "tel" : "text"} autoComplete={/e-?mail/i.test(field.label) ? "email" : /phone|mobile/i.test(field.label) ? "tel" : /name/i.test(field.label) ? "name" : "on"} value={answers[field.id] || ""} onChange={event => setAnswers(prev => ({ ...prev, [field.id]: event.target.value }))} placeholder={field.label} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30" />}</>}
          </div>)}
        </fieldset>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        <button disabled={mutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-neutral-950 transition hover:bg-primary/90 disabled:opacity-60">{mutation.isPending ? <><LoaderCircle className="size-4 animate-spin" />Sending…</> : <>Submit details<ArrowRight className="size-4" /></>}</button>
        {form.allowSkip && <button type="button" disabled={mutation.isPending} onClick={() => void submit(true)} className="w-full py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60">Skip for now</button>}
      </form>}
    </section>
  </div>;
}
