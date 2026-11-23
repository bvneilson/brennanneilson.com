// Every word on /coo. Plain strings, so `node scripts/copy-text.ts` hands all of it to the voice gate.
//
// Facts come from two places only: his resume (R34) and the header comments of the COO's agent
// supervisor (R36). The stories name no customer and no business, and the only numbers are the
// ones in those sources. Live counts come from the stats file, never from here.

export const coo = {
  meta: {
    title: 'The COO',
    description:
      'How my AI COO takes a real order all the way to a verified live site, and two things that broke along the way.',
  },
  label: 'Case study',
  heading: 'The COO',
  lede: [
    "The COO is a team of AI agents I designed and run on my own time. It takes a real customer order for a website and drives it all the way to a verified live site!",
    'Along the way it writes a build brief, hands the work to a Claude Code agent, deploys it, and checks the result before it marks the order complete. Running it taught me that agents are unreliable narrators of their own success. So it verifies their work against real system state.',
  ],
  stackLabel: 'Built with',
  stack: [
    'TypeScript and Node on Bun',
    'PostgreSQL with an event-sourced job log',
    'The Anthropic API',
    'MCP servers for tool access',
    'Vercel',
  ],
  diagram: {
    label: "How it's built",
    heading: 'Every order takes the same five steps',
    intro:
      'The engineering that mattered was the trust layer, not the prompting. A build only counts once something other than the agent that built it says it works!',
    listLabel: 'How an order moves through the COO',
    steps: [
      { name: 'Order', body: 'A customer orders a website.' },
      { name: 'Plan', body: 'The COO turns the order into a build brief.' },
      { name: 'Build', body: 'A Claude Code agent builds the site from the brief, and the COO deploys it.' },
      {
        name: 'Verify',
        body: "Deterministic checks test the deployed result against real system state. The agent's own report of success doesn't count.",
      },
      { name: 'Live', body: 'The order is marked complete only after those checks pass.' },
    ],
    trustLabel: 'The trust layer',
    trust: [
      'An LLM judge scores each build against its brief before anything becomes customer-orderable.',
      'A separate reconciler is the only part of the system allowed to flip that switch.',
      'Every structural change ships behind a flag that logs what it would have done without doing it. Those flags have caught my own bugs before a customer ever saw them!',
    ],
  },
  numbers: {
    label: 'Live numbers',
    heading: 'The work, counted live from GitHub',
    intro:
      'My Mac counts these on GitHub and publishes them here. Each number shows its source and exact time when you hover over it. If one gets more than a week old, it comes off the page!',
    unavailable: "The live numbers aren't available right now. They'll be back as soon as they load!",
  },
  incidents: {
    label: 'What broke',
    heading: 'Two things that broke, and how I fixed them',
    fixLabel: 'The fix',
    lessonLabel: 'Lesson',
    stories: [
      {
        title: 'The night thousands of orphaned processes froze my Mac',
        when: 'July 2, 2026',
        body: [
          'The COO runs Claude Code agents headless to build and verify sites. Each agent starts its own MCP servers as child processes. When an agent hit its timeout, I killed the agent and nothing else.',
          "Its MCP servers kept running with no parent. Over hours they piled up into the thousands, until the Mac couldn't fork another process and froze.",
        ],
        fix: 'Every agent now starts in its own process group, and a timeout signals the whole group. The children go down with their parent.',
        later:
          "On October 29 it came back another way. The shells an agent starts run in process groups of their own, so they outlived it too, and the 16 GB Mac hit a load of 202! Now a kill takes a snapshot of the agent's whole process tree and stops everything in it.",
        lesson: 'Kill the tree, not the parent.',
      },
      {
        title: 'The 200 OK that was a parked page',
        when: '',
        body: [
          "A storefront domain returned 200 OK while it served a registrar's parked page. A health check that only looked at status codes called the site healthy. There was no store there at all!",
        ],
        fix: 'No project here counts as verified on a status code. Each one gets a browser test that walks through its claim, every night, at desktop and phone sizes.',
        later: '',
        lesson: 'A 200 OK only means the server answered.',
      },
    ],
  },
  closing: {
    body: 'Every project on this site makes one claim, and a browser test checks it every night.',
    link: 'See how each one did on its latest run',
  },
};
