import re, sys
root = sys.argv[1]
src = open(f'{root}/HoshiyarPK-summary.html').read()
head_css = src[:src.index('</style>') + len('</style>')]
nav_start = src.index('<nav class="top">'); nav_end = src.index('</nav>') + 6
nav = src[nav_start:nav_end]
tail = src[src.index('<footer class="site-foot"'):]

def build(cfg, body):
    h = head_css
    h = h.replace('--teal:#2F7A6F; --deep:#1D4E46; --mint:#E3F2EF;', f"--teal:{cfg['acc']}; --deep:{cfg['deep']}; --mint:{cfg['tint']};")
    h = h.replace('#245D54', cfg['hover']).replace('rgba(29,78,70,.22)', cfg['shadow'])
    h = h.replace('#7FC2B5', cfg['light']).replace('#D8ECE6,#E9F3EF', cfg['cover'])
    h = re.sub(r'<title>.*?</title>', f"<title>{cfg['title']}</title>", h)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{cfg["desc"]}">', h)
    h = h.replace('href="favicon.svg"', f'href="{cfg["fav"]}.svg"').replace('href="favicon-32.png"', f'href="{cfg["fav"]}-32.png"')
    h = h.replace('href="apple-touch-icon.png"', f'href="{cfg["touch"]}"')
    h = h.replace('data-dot="#2F7A6F" data-spark="#D97D5E"', f'data-dot="{cfg["acc"]}" data-spark="{cfg["spark"]}"')
    n = nav.replace('stroke="#2F7A6F"', f'stroke="{cfg["acc"]}"').replace('fill="#2F7A6F"', f'fill="{cfg["acc"]}"').replace('HoshiyarPK.dc.html', cfg['full'])
    nxt = '\n  <nav class="next-row" aria-label="More work">\n    <a class="nr-home" href="Portfolio.dc.html"><span class="nr-label">Back to</span><span class="nr-title"><span class="arrow">←</span> Home</span></a>\n    <a class="nr-next" href="%s-summary.html"><span class="nr-label">Next case study</span><span class="nr-title">%s <span class="arrow">→</span></span></a>\n  </nav>' % (cfg['next'], cfg['nextName'])
    return h + '\n</head>\n<body>\n\n' + n + '\n\n<main class="wrap">\n' + body + nxt + '\n</main>\n\n' + tail

ef = dict(acc='#BF6785', deep='#8E4560', tint='#F8E8EE', hover='#A4536F', shadow='rgba(142,69,96,.22)', light='#E3A9BC',
          cover='#F3E4EA,#F8F2FB', spark='#D6A947', fav='favicon-equityflow', touch='apple-touch-icon-equityflow.png',
          full='EquityFlow.dc.html', next='MarineLink', nextName='Marine Link', title='EquityFlow Summary · Areej Butt',
          desc='The short version of the EquityFlow case study: an equity crowdfunding platform where compliance feels like guidance instead of a wall.')
ef_body = '''
  <header class="hero">
    <div class="cs-toggle" role="navigation" aria-label="Case study length"><a href="EquityFlow.dc.html">Full case study</a><a class="on" href="EquityFlow-summary.html" aria-current="page">Summary</a></div>
    <div class="eyebrow" style="color:var(--teal)">PRODUCT DESIGN &amp; DESIGN SYSTEMS</div>
    <h1 class="fr">EquityFlow</h1>
    <p class="tagline">Investing is a legal act. The interface has to carry that weight without scaring anyone off.</p>
    <p class="lead">An equity crowdfunding platform where compliance had to feel like guidance instead of a wall.</p>
    <div class="meta">
      <span><b>Role</b> Solo product designer (Carbonteq internship)</span>
      <span><b>Platform</b> Desktop web</span>
      <span><b>Duration</b> 5 weeks</span>
    </div>
    <div class="cover"><div data-video="ef-hero" data-alt="EquityFlow walkthrough: browsing campaigns, opening SustainaPak, choosing an amount to invest" style="width:100%;aspect-ratio:1120/788;"></div></div>
  </header>

  <section class="reveal">
    <div class="num">01 · THE PROBLEM</div>
    <h2 class="fr">A wall of forms before the interesting part</h2>
    <p>Before anyone can invest $100, the law asks them to prove who they are, disclose their income and net worth, connect a bank account, and stay inside an annual cap they've probably never heard of. Most platforms front-load all of it, and first-time investors drop out at the forms.</p>
    <div class="stats">
      <div class="stat"><div class="big">3</div><div class="lbl">user groups with different goals: investors want speed, founders want visibility, operations wants a paper trail</div></div>
      <div class="stat"><div class="big">4</div><div class="lbl">legal requirements that shaped the product more than any visual choice</div></div>
      <div class="stat"><div class="big">2</div><div class="lbl">top-level tabs for the whole investor product: Campaigns and Portfolio</div></div>
    </div>
    <div class="insight"><b>The reframe:</b> the design problem was never the campaign grid. Each legal check is a moment where the platform has to say "no" or "not yet" to someone trying to give it money, so I treated each one as a <b>copy and layout problem</b>, not an error.</div>
  </section>

  <section class="reveal">
    <div class="num">02 · THE PROCESS</div>
    <h2 class="fr">Constraints were legal, so research came first</h2>
    <ol class="tl" style="--n:5;--grad:linear-gradient(90deg, #D97D5E, #D97D5E, #2F7A6F, #2F7A6F, #B18FCF);--gradv:linear-gradient(180deg, #D97D5E, #D97D5E, #2F7A6F, #2F7A6F, #B18FCF)">
      <li style="--c:#D97D5E;--i:0"><span class="tl-dot">1</span><span class="tl-text"><b>Domain research</b><small>Week 1 · Reg CF rules, caps, escrow</small></span></li>
      <li style="--c:#D97D5E;--i:1"><span class="tl-dot">2</span><span class="tl-text"><b>Users &amp; architecture</b><small>Week 2 · Three roles, two-tab IA</small></span></li>
      <li style="--c:#2F7A6F;--i:2"><span class="tl-dot">3</span><span class="tl-text"><b>Flows &amp; wireframes</b><small>Week 3 · Grayscale, every state</small></span></li>
      <li style="--c:#2F7A6F;--i:3"><span class="tl-dot">4</span><span class="tl-text"><b>Harness &amp; build</b><small>Week 4 · Tokens, patterns, hi-fi</small></span></li>
      <li style="--c:#B18FCF;--i:4"><span class="tl-dot">5</span><span class="tl-text"><b>States &amp; QA</b><small>Week 5 · Empty, error, polish</small></span></li>
    </ol>
    <ul class="learn">
      <li><b>Browse before verify.</b>Anyone can open every campaign, its Form C and its Q&amp;A. The identity and suitability checks only appear after someone picks an amount, when the ask has a reason attached.</li>
      <li><b>Grayscale first.</b>Every screen was solved without colour or real numbers, so reviews stayed on field order and what each screen was asking for. Colour later changed almost nothing structural.</li>
    </ul>
  </section>

  <section class="reveal">
    <div class="num">03 · THE SOLUTION</div>
    <h2 class="fr">Compliance as an interface problem</h2>
    <p>Each legal requirement shows up at the moment it applies, in plain language.</p>
    <div class="pillars">
      <div class="pillar"><h3>IDENTITY</h3><p>A privacy note comes before the first field, and errors say exactly what's wrong.</p></div>
      <div class="pillar"><h3>SUITABILITY</h3><p>Framed as a legal requirement, not a sales qualifier. No marketing copy.</p></div>
      <div class="pillar"><h3>ANNUAL CAP</h3><p>A headline number on the portfolio. Over-cap amounts show exactly what would fit.</p></div>
      <div class="pillar"><h3>ESCROW</h3><p>"In Escrow" is its own status, so held money never looks like a failed payment.</p></div>
    </div>
    <div class="shot"><div data-video="ef-detail" data-alt="Campaign detail, zooming in on the pinned invest panel" style="width:100%;aspect-ratio:1120/788;"></div></div>
    <p style="margin-top:12px;font-size:14.5px;color:var(--muted)">Campaign detail: terms and disclosures scroll on the left while the invest panel stays pinned on the right.</p>
  </section>

  <section class="reveal">
    <div class="num">04 · DECISIONS I OWNED</div>
    <h2 class="fr">Refuse early, and explain what would work</h2>
    <ul class="learn">
      <li><b>Two tabs, permanently.</b>Watchlists, notifications and settings all wanted top-level slots. They went into the account menu so users never wonder where something lives.</li>
      <li><b>Disabled over dismissed.</b>When an amount breaks the cap, the button says "Fix amount to continue" instead of failing on submit.</li>
      <li><b>Mono for every figure.</b>Digits line up down a column, so amounts can be compared at a glance.</li>
    </ul>
  </section>

  <section class="reveal">
    <div class="num">05 · THE DESIGN HARNESS</div>
    <h2 class="fr">Stop building screens, write the system down</h2>
    <p>By the tenth screen the prototype had drifted: three button heights, two input borders, a nav with shifting padding. I paused screen work for two days and wrote a <b>design harness</b>: a short router file plus twenty pattern files, with no hardcoded values and a creation gate that says "stop and name the gap" instead of inventing something new.</p>
    <div class="insight" style="border-left-color:var(--teal);background:var(--mint);color:var(--deep)">It felt like losing time, and it was the reason the <b>last fifteen screens took less effort than the first ten</b>.</div>
  </section>

  <section class="reveal">
    <div class="num">06 · REFLECTION</div>
    <h2 class="fr">Write the system down before you scale the screens</h2>
    <p>The founder side and operations console exist as flows, not screens yet, and the product is desktop-only. If I ran it again, I'd test the suitability step with real first-time investors early: it's the screen where the platform sounds least like it's on your side.</p>
  </section>

  <div class="cta reveal">
    <h2 class="fr">Want the whole story?</h2>
    <p>User roles, the investment flow, every compliance rule, the visual system and the full design harness are in the full case study.</p>
    <div class="btns">
      <a class="btn primary" href="EquityFlow.dc.html">Read the full case study</a>
      <a class="btn ghost" href="https://app.pen.dev/s/rQJpVihPtcg-NjkIeYvdXGNkCr4jzsic_SOWLt3B3WI" target="_blank" rel="noopener">View the wireframes</a>
    </div>
  </div>
'''

ml = dict(acc='#214C7A', deep='#173A5E', tint='#E3EDF7', hover='#1A3D63', shadow='rgba(23,58,94,.22)', light='#7FA3C4',
          cover='#DCEEF5,#EAF6F3', spark='#D97D5E', fav='favicon-marinelink', touch='apple-touch-icon-marinelink.png',
          full='MarineLink.dc.html', next='HoshiyarPK', nextName='HoshiyarPK', title='Marine Link Summary · Areej Butt',
          desc='The short version of the Marine Link case study: an immersive ocean descent for pre-K and early elementary kids.')
ml_body = '''
  <header class="hero">
    <div class="cs-toggle" role="navigation" aria-label="Case study length"><a href="MarineLink.dc.html">Full case study</a><a class="on" href="MarineLink-summary.html" aria-current="page">Summary</a></div>
    <div class="eyebrow" style="color:var(--teal)">CONCEPT, BRAND &amp; VISUAL DESIGN</div>
    <h1 class="fr">Marine Link</h1>
    <p class="tagline">Most ocean content is informative. Marine Link is immersive.</p>
    <p class="lead">An exploration-driven ocean experience that turns a scroll into a deep-sea descent for pre-K and early elementary kids.</p>
    <div class="meta">
      <span><b>Role</b> Lead Designer: concept, brand &amp; visual design</span>
      <span><b>Team</b> 2 designers</span>
      <span><b>Platform</b> Web</span>
      <span><b>Duration</b> 2 weeks</span>
    </div>
    <div class="cover"><div data-video="ml-hero" data-alt="Marine Link: diving from the Sunlight Zone down to the Trenches" style="width:100%;aspect-ratio:1120/700;"></div></div>
  </header>

  <section class="reveal">
    <div class="num">01 · THE IDEA</div>
    <h2 class="fr">Curiosity first, not a quiz</h2>
    <p>Most ocean content treats learning like a test, with dry facts and quizzes, and most websites are too hard for kids who can't read yet. Marine Link works like the ocean itself: kids sink deeper and discover one creature at a time.</p>
    <div class="stats">
      <div class="stat"><div class="big">5</div><div class="lbl">ocean zones, from the sunlit surface to the hadal trenches</div></div>
      <div class="stat"><div class="big">35</div><div class="lbl">creatures, 7 per zone, so progress is a number a child can count toward</div></div>
      <div class="stat"><div class="big">23</div><div class="lbl">core components documented in the design harness</div></div>
    </div>
  </section>

  <section class="reveal">
    <div class="num">02 · THE PROCESS</div>
    <h2 class="fr">Ideate fast, then build the system underneath</h2>
    <ol class="tl" style="--n:7;--grad:linear-gradient(90deg, #D97D5E, #D97D5E, #2F7A6F, #2F7A6F, #2F7A6F, #B18FCF, #B18FCF);--gradv:linear-gradient(180deg, #D97D5E, #D97D5E, #2F7A6F, #2F7A6F, #2F7A6F, #B18FCF, #B18FCF)">
      <li style="--c:#D97D5E;--i:0"><span class="tl-dot">1</span><span class="tl-text"><b>Paper &amp; Canva</b><small>Sketches, moodboard</small></span></li>
      <li style="--c:#D97D5E;--i:1"><span class="tl-dot">2</span><span class="tl-text"><b>Competitive scan</b><small>Edu &amp; ocean apps</small></span></li>
      <li style="--c:#2F7A6F;--i:2"><span class="tl-dot">3</span><span class="tl-text"><b>Zone design</b><small>5 depth zones</small></span></li>
      <li style="--c:#2F7A6F;--i:3"><span class="tl-dot">4</span><span class="tl-text"><b>Identity &amp; color</b><small>Wordmark, palettes</small></span></li>
      <li style="--c:#2F7A6F;--i:4"><span class="tl-dot">5</span><span class="tl-text"><b>Content &amp; art</b><small>Facts + creature art</small></span></li>
      <li style="--c:#B18FCF;--i:5"><span class="tl-dot">6</span><span class="tl-text"><b>Build</b><small>Rough first pass</small></span></li>
      <li style="--c:#B18FCF;--i:6"><span class="tl-dot">7</span><span class="tl-text"><b>Usability audit</b><small>Fixed by hand</small></span></li>
    </ol>
  </section>

  <section class="reveal">
    <div class="num">03 · THE SOLUTION</div>
    <h2 class="fr">Scroll deeper, discover, collect</h2>
    <p>Depth is the navigation, with no tabs or menus. Every zone repeats the same three cues (name, depth, and an audio and color shift), so the pattern reads before a child can read the words.</p>
    <div class="pillars">
      <div class="pillar"><h3>CREATURE CARDS</h3><p>Tap for a kawaii illustration and a spoken fact, then flip for a real photo.</p></div>
      <div class="pillar"><h3>CREATURE MAP</h3><p>All 35 creatures by zone, with a "you are here" badge.</p></div>
      <div class="pillar"><h3>QUIZ</h3><p>Opens from a trophy, not a "?". Picture answers, and confetti for a correct pick.</p></div>
      <div class="pillar"><h3>AUDIO</h3><p>Voice-read facts, a tap-to-talk search, and a soundscape for each zone.</p></div>
    </div>
    <div class="shot"><div data-video="ml-card-front" data-alt="Tapping the octopus opens its creature card with an illustrated fact" style="width:100%;aspect-ratio:1120/700;"></div></div>
    <p style="margin-top:12px;font-size:14.5px;color:var(--muted)">Each zone has its own palette, from bright surface light down to bioluminescent trench accents, so a pre-reader can tell "I'm somewhere new" from color alone.</p>
  </section>

  <section class="reveal">
    <div class="num">04 · WHAT WE FIXED</div>
    <h2 class="fr">The audit caught what the moodboard didn't</h2>
    <ul class="learn">
      <li><b>Red/green status on a dark background</b>Failed for colorblind users. Now icon-based status with clear labels.</li>
      <li><b>Progress bar filled gold at 0/35</b>Looked complete before any progress. Now a muted track that fills as creatures are found.</li>
      <li><b>Filter tabs that didn't filter</b>"Explored" still showed every creature. The selected tab now hides or dims the rest.</li>
    </ul>
  </section>

  <section class="reveal">
    <div class="num">05 · THE DESIGN HARNESS</div>
    <h2 class="fr">The fix was documentation, not more prompting</h2>
    <p>Claude's first build was rough: placeholder art, overlapping icons and colors that drifted between screens. I audited the shipped prototype and wrote a <b>design harness</b>: design tokens, 23 components with their states, a motion spec and a voice guide, plus a strict rule that nothing new gets invented without approval.</p>
    <div class="insight" style="border-left-color:var(--teal);background:var(--mint);color:var(--deep)">New screens then <b>matched the shipped app on the first pass</b>, with no more rounds of manual correction.</div>
  </section>

  <section class="reveal">
    <div class="num">06 · REFLECTION</div>
    <h2 class="fr">Prompting isn't a shortcut around design skill</h2>
    <p>The build proves that depth-as-scroll and a countable creature loop make exploring feel different from reading. It hasn't yet proven that exploring for fun and actually learning are the same thing. Next: a second layer of content for each creature, the accessibility fixes we've already identified, and testing with real kids in the target age group.</p>
  </section>

  <div class="cta reveal">
    <h2 class="fr">Want the whole story?</h2>
    <p>Sketches, the competitive map, logo and type explorations, every zone palette and the full harness diagram are in the full case study.</p>
    <div class="btns">
      <a class="btn primary" href="MarineLink.dc.html">Read the full case study</a>
      <a class="btn ghost" href="https://areej-butt.github.io/marine-link/" target="_blank" rel="noopener">Visit the website</a>
    </div>
  </div>
'''
open(f'{root}/EquityFlow-summary.html','w').write(build(ef, ef_body))
open(f'{root}/MarineLink-summary.html','w').write(build(ml, ml_body))
print('ok')
