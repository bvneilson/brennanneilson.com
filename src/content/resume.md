---
reviewedAt: 2026-11-23
---

# Brennan Neilson

AI / Full-Stack Software Engineer

American Fork, UT · bvneilson@gmail.com · linkedin.com/in/brennanneilson · github.com/bvneilson

## Summary

I'm a senior software engineer with 10 years of shipping production web apps. I led my team's adoption of AI-assisted development by building the tooling that made it worth using. On my own time, I designed and run a multi-agent system that takes a real customer order all the way to a verified live site. It taught me that agents are unreliable narrators of their own success. So I verify their work against real system state. I still own full-stack features across React, TypeScript, Clojure, ClojureScript, Node, and PostgreSQL.

## Skills

- **AI / LLM:** LLM integration in production, AI agents and orchestration, evaluation and quality gating, prompt design, Claude Code, Model Context Protocol (MCP), Anthropic API, AI-assisted developer tooling
- **Languages:** JavaScript, TypeScript, Clojure, ClojureScript, SQL, PHP
- **Frontend:** React, Vue (Nuxt, Vuetify), Tailwind CSS, accessible UI (WCAG AA), Figma to code
- **Backend / Data:** Node.js, PostgreSQL, Supabase, event-sourced pipelines
- **Cloud / Ops:** AWS, Vercel, production incident investigation

## Experience

### Banzai, Inc. · Senior Software Engineer
*Apr 2024 – Present*

- Led the team's adoption of AI-assisted development by building the tooling that made it worth using.
- Build AI tools that help the team review code and answer questions faster.
- Deliver full-stack features end to end in React, Clojure, ClojureScript, and PostgreSQL.
- Build tools that let non-technical teammates create and publish content on their own.
- Build accessible interactive learning experiences in React from Figma designs.

### Principler · Front-End Software Engineer
*Dec 2023 – Apr 2024*

- Built the React and TypeScript UI for a customer-facing web app against a Supabase backend.
- Partnered with product on scope and requirements so frontend work matched what the business actually needed.

### Rakuten Advertising · Software Engineer
*Mar 2022 – May 2023*

- Tech lead on an advertising-tooling project end to end, owning features, fixes, and releases in Vue (Nuxt, Vuetify) and TypeScript.
- Built a JSON diffing tool on the fast-json-patch package to make config changes reviewable.
- Ran code reviews, authored technical specs, and drove bi-weekly delivery with multidisciplinary teams.

### Homie · UI Developer
*Dec 2021 – Feb 2022*

- Translated Figma designs into interactive customer-facing UI in Vue.js and Tailwind CSS.

### Henry Schein One · Web Developer
*Apr 2017 – Dec 2021*

- Shipped features across multiple brand websites for four and a half years, working the full stack in HTML, CSS, JavaScript, and PHP CodeIgniter.
- Built landing pages and monthly HTML email, and delivered a post-joint-venture design overhaul across the core sites, including the rebrand and the UI/UX work that came with it.

### Elite IT Partners · Application Developer
*Jun 2016 – Apr 2017*

- Built enterprise web applications in PHP, MySQL, and JavaScript, including reporting features that informed C-level decisions.

## Selected project

### Autonomous operations system · Personal project

Designed, built, and run a system that takes a customer order for a website and drives it to a live, verified site. It assembles a build brief, dispatches the work to a Claude Code agent, deploys it, and verifies the result before marking the order complete. Built with TypeScript and Node on Bun, PostgreSQL with an event-sourced job log, the Anthropic API, Vercel, and MCP servers for tool access.

The engineering that mattered was the trust layer, not the prompting. An LLM judge scores each build against the brief before anything becomes customer-orderable, and a separate reconciler is the only component allowed to flip that flag. Deterministic verifiers replaced self-reported success after a canceled deploy was misclassified as an error and quietly failed every promotion behind it. Every structural change ships behind a flag that logs the action it would have taken without taking it, which has caught six of my own defects before a customer saw them.

## Education

### Bloom Institute of Technology (formerly Lambda School) · Computer Science
*2019 – 2021*

### DevMountain · Web Development
*2015*
