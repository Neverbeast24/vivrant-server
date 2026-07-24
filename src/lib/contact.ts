/** Public contact for Campus / Plus access requests. */
export const SITE_CONTACT = {
  name: "Daniella D. Sayson",
  email: "saysondaniella.ds24@gmail.com",
  phone: "09213655627",
  phoneTel: "+639213655627",
  phoneDisplay: "0921 365 5627",
} as const;

export type ContactPlan = "plus" | "campus" | "general";

export function contactMailto(plan: ContactPlan = "general") {
  const subjects: Record<ContactPlan, string> = {
    plus: "VIVRΛNT Plus access request (₱299/month)",
    campus: "VIVRΛNT Campus / team access request",
    general: "VIVRΛNT inquiry",
  };
  const bodies: Record<ContactPlan, string> = {
    plus: `Hi ${SITE_CONTACT.name},\n\nI'd like to start VIVRΛNT Plus (₱299/month).\n\nName:\nEmail:\nPreferred start date:\n\nThank you!`,
    campus: `Hi ${SITE_CONTACT.name},\n\nI'm interested in VIVRΛNT Campus access for a research program or team.\n\nOrganization:\nRole:\nTeam size:\nNeeds:\n\nThank you!`,
    general: `Hi ${SITE_CONTACT.name},\n\nI have a question about VIVRΛNT.\n\n`,
  };

  const params = new URLSearchParams({
    subject: subjects[plan],
    body: bodies[plan],
  });
  return `mailto:${SITE_CONTACT.email}?${params.toString()}`;
}

export function contactSmsHref() {
  return `sms:${SITE_CONTACT.phoneTel}`;
}

export function contactTelHref() {
  return `tel:${SITE_CONTACT.phoneTel}`;
}
