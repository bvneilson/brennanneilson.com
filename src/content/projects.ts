import type { Project } from './types.ts';

// v1 showcase. Claims are verbatim from spec §7.2. Each slug has truth/<slug>.spec.ts, whose
// test.describe title is the slug. Change a claim and its walk must prove the new sentence.
export const projects: Project[] = [
  {
    slug: 'draw-night',
    name: 'Draw Night',
    url: 'https://draw-night-five.vercel.app',
    claim:
      'Add names, group households, pass one phone around: everyone draws a Secret Santa name, and nobody gets themselves, their partner, or a swap.',
    tags: ['web app', 'holidays'],
  },
  {
    slug: 'fantasy-autopilot',
    name: 'Fantasy on Autopilot',
    url: 'https://fantasyonautopilot.com',
    claim: 'Free fantasy-football guides plus a $49 playbook kit for running your team with your own AI agent.',
    tags: ['guides', 'digital product'],
    allowWrites: [
      // The kit's checkout-session endpoint. One click creates one unpaid Stripe Checkout Session.
      '^https://fantasyonautopilot\\.com/api/checkout$',
      // Stripe's hosted checkout page loading that session. Without it the page can't show the price.
      '^https://api\\.stripe\\.com/v1/payment_pages/cs_live_[A-Za-z0-9]+/init$',
    ],
  },
  {
    slug: 'brennan-builds',
    name: 'Brennan Builds',
    url: 'https://brennanbuilds.dev',
    claim: 'Click through 12 live demo websites without signing up; custom builds from $500.',
    tags: ['web studio', 'templates'],
  },
  {
    slug: 'golf-toolbox',
    name: 'Golf Toolbox',
    url: 'https://golftoolbox.app',
    claim:
      'Answer three questions about your swing and get a shaft flex, weight and kick-point recommendation, no account needed.',
    tags: ['web app', 'golf'],
  },
];
