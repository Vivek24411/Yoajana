"use client";

import type { ComponentProps } from "react";

/** A <select> that submits its form on change, so picking a state needs no extra tap. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
